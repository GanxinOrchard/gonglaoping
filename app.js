/* ===============================
   柑心果園 前端腳本（優化版）
   =============================== */

// 尺寸對照（單顆直徑，cm）
const SIZE_MAP = {
  "23A":"6.0–6.5", "25A":"6.5–7.0", "27A":"7.0–7.5", "30A":"7.5–8.0"
};

// 折扣碼（每年採收期有效：當年10/01 ~ 隔年04/30）
function currentSeasonRange() {
  const now = new Date();
  const y = now.getMonth()+1 >= 10 ? now.getFullYear() : now.getFullYear()-1;
  return { start: new Date(`${y}-10-01T00:00:00`), end: new Date(`${y+1}-04-30T23:59:59`) };
}
const SEASON = currentSeasonRange();
const COUPONS = {
  "GX200": { type:"minus", value:200, validFrom:SEASON.start, validTo:SEASON.end, note:"折200" },
  "GX90":  { type:"rate",  value:0.9, validFrom:SEASON.start, validTo:SEASON.end, note:"九折" }
};

// 小工具
const $ = (sel, doc=document)=>doc.querySelector(sel);
const $$ = (sel, doc=document)=>Array.from(doc.querySelectorAll(sel));
const fmt = n => 'NT$ '+Number(n||0).toLocaleString('en-US');

// 初始化滑軌箭頭
function bindSliderArrows(scope){
  const wrap = $(scope);
  if(!wrap) return;
  const box = wrap.querySelector('.slides');
  wrap.querySelector('.left')?.addEventListener('click', ()=> box.scrollBy({left:-box.clientWidth*0.9, behavior:'smooth'}));
  wrap.querySelector('.right')?.addEventListener('click',()=> box.scrollBy({left: box.clientWidth*0.9, behavior:'smooth'}));
}

// 量表長條渲染
function renderMeters(){
  $$('.bar').forEach(b=>{
    const v = Math.max(0, Math.min(100, Number(b.dataset.val||0)));
    requestAnimationFrame(()=> b.style.setProperty('--w', v+'%'));
    b.style.setProperty('--w', v+'%');
    b.style.setProperty('width', '100%');
    b.style.setProperty('position','relative');
    // 動畫
    b.animate([{width:'0%'},{width:v+'%'}], {duration:600,fill:'forwards'});
    b.style.setProperty('--v', v);
    // 也改 ::after 寬度
    b.style.setProperty('--after', v+'%');
    b.style.setProperty('overflow','hidden');
    b.style.setProperty('borderRadius','999px');
    b.style.setProperty('background','#f3f4f6');
    b.style.setProperty('position','relative');
    b.style.setProperty('display','block');
    b.style.setProperty('height','10px');
    b.style.setProperty('border','0');
    b.style.setProperty('padding','0');
    b.style.setProperty('margin','0');
    b.style.setProperty('boxSizing','border-box');
    b.style.setProperty('contain','content');
    b.style.setProperty('pointerEvents','none');
    b.style.setProperty('webkitMaskImage','-webkit-radial-gradient(white, black)');
    b.style.setProperty('maskImage','radial-gradient(white, black)');
    b.style.setProperty('position','relative');
    b.style.setProperty('overflow','hidden');
    b.style.setProperty('background','var(--bar-bg,#f3f4f6)');
    b.style.setProperty('borderRadius','999px');
    b.style.setProperty('boxShadow','inset 0 0 0 0 rgba(0,0,0,0)');
    b.style.setProperty('transform','translateZ(0)');
    b.style.setProperty('willChange','width');
    b.style.setProperty('display','block');
    // 用 child 塞入進度
    if(!b.firstElementChild){
      const prog = document.createElement('div');
      prog.style.cssText='position:absolute;inset:0;max-width:100%;width:'+v+'%;background:linear-gradient(90deg,#fed7aa,#f59e0b);border-radius:999px';
      b.appendChild(prog);
      setTimeout(()=>prog.style.width=v+'%',10);
    }
  });
}

// 規格點擊：同步尺寸
function bindSpecs(){
  $$('.product').forEach(card=>{
    const chips = $$('.chip', card);
    const dia = $('.dia', card);
    chips.forEach(ch=>{
      ch.addEventListener('click', ()=>{
        chips.forEach(x=>x.classList.remove('on'));
        ch.classList.add('on');
        const size = ch.dataset.size;
        dia.textContent = SIZE_MAP[size] || '－';
      });
    });
  });
}

// 產季時間軸資料
function buildMonths(){
  const months = [
    {m:'10', note:'青皮椪柑', tone:'#86efac'},
    {m:'11', note:'椪柑高峰', tone:'#facc15'},
    {m:'12', note:'橙皮始 | 茂谷開季', tone:'#fb923c'},
    {m:'1', note:'橙皮穩定', tone:'#f59e0b'},
    {m:'2', note:'橙皮甘甜', tone:'#f59e0b'},
    {m:'3', note:'尾聲/儲藏', tone:'#fed7aa'},
    {m:'4', note:'儲藏柑', tone:'#fde68a'}
  ];
  const pon = $('#ponkanMonths'), mur = $('#murcottMonths');
  months.forEach((x,i)=>{
    const el = document.createElement('div');
    el.className='month-card';
    el.innerHTML = `<span class="month-emoji" style="filter:drop-shadow(0 1px 0 rgba(0,0,0,.05))">🍊</span>
      <div class="month-name">${x.m} 月</div>
      <div class="month-note">${x.note}</div>`;
    el.style.background = '#fff';
    pon.appendChild(el);
  });
  // 茂谷 12–3
  ['12','1','2','3'].forEach(m=>{
    const el = document.createElement('div');
    el.className='month-card';
    el.innerHTML = `<span class="month-emoji">🍊</span>
      <div class="month-name">${m} 月</div>
      <div class="month-note">${m==='12'?'開季':(m==='3'?'尾聲':'當季')}</div>`;
    mur.appendChild(el);
  });
}

// 加入購物車（不自動開面板）
const CART = {
  items: [], coupon:null, disc:0, shipping:0,
  load(){ try{ const s=localStorage.getItem('cart'); this.items=s?JSON.parse(s):[]; }catch{} },
  save(){ localStorage.setItem('cart', JSON.stringify(this.items)); },
  add({sku,title,price,size}){
    const key = sku+'|'+size;
    const hit = this.items.find(i=>i.key===key);
    if(hit) hit.qty++;
    else this.items.push({key,sku,title,price,size,qty:1});
    this.save(); updateCartIcon(); toast('已加入購物車');
    renderCart();
  },
  empty(){ this.items=[]; this.coupon=null; this.save(); renderCart(); updateCartIcon(); }
};
function updateCartIcon(){ $('#cart-count').textContent = CART.items.reduce((a,b)=>a+b.qty,0); }

// 渲染購物車內容與結帳金額
function renderCart(){
  const ul = $('#cart-list'); if(!ul) return;
  ul.innerHTML='';
  CART.items.forEach((it,idx)=>{
    const li = document.createElement('li'); li.className='cart-item';
    li.innerHTML = `
      <img src="https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png" alt="${it.title} 裝箱圖" loading="lazy">
      <div class="t">${it.title}｜${it.size}</div>
      <div class="p">NT$ ${it.price}</div>
      <div class="qty">
        <button aria-label="減1">-</button>
        <span>${it.qty}</span>
        <button aria-label="加1">+</button>
      </div>`;
    const [btnMinus, , btnPlus] = li.querySelectorAll('.qty button, .qty span');
    btnMinus.addEventListener('click',()=>{ it.qty=Math.max(0,it.qty-1); if(it.qty===0) CART.items.splice(idx,1); CART.save(); renderCart(); updateCartIcon(); });
    btnPlus .addEventListener('click',()=>{ it.qty++; CART.save(); renderCart(); updateCartIcon(); });
    ul.appendChild(li);
  });

  // 小計/運費/折扣/總額
  const sub = CART.items.reduce((s,i)=>s + i.price*i.qty, 0);
  const ship = sub>=1800 || sub===0 ? 0 : 160;
  let disc = 0;
  if (CART.coupon){
    const c = COUPONS[CART.coupon];
    const now = new Date();
    if (c && now>=c.validFrom && now<=c.validTo){
      disc = c.type==='minus' ? c.value : Math.round(sub*(1-c.value));
      $('#coupon-msg').textContent = `已套用：${CART.coupon}（${c.note}）`;
    }else{
      $('#coupon-msg').textContent = '折扣碼已過期或無效';
      CART.coupon = null;
    }
  }else $('#coupon-msg').textContent='';

  $('#sum-sub').textContent = fmt(sub);
  $('#sum-ship').textContent = fmt(ship);
  $('#sum-disc').textContent = disc ? ('- '+fmt(disc)) : '- NT$0';
  $('#sum-total').textContent = fmt(Math.max(0, sub + ship - disc));
}

// 套用折扣碼
$('#apply-coupon').addEventListener('click', ()=>{
  const code = ($('#coupon-input').value||'').trim().toUpperCase();
  if (!COUPONS[code]) { $('#coupon-msg').textContent='無此折扣碼'; return; }
  CART.coupon = code; renderCart();
});

// 表單記憶
(function persistForm(){
  const form = $('#checkout'); if(!form) return;
  const fields = ['name','phone','email','addr','remark'];
  fields.forEach(n=>{
    const el = form.elements[n];
    if(!el) return;
    const k='fld_'+n; const v=localStorage.getItem(k); if(v) el.value=v;
    el.addEventListener('input',()=> localStorage.setItem(k, el.value));
  });
})();

// 物流須知 → 勾選才可送出
$('#agree').addEventListener('change', e=>{
  $('#btn-submit').disabled = !e.target.checked;
});

// 綁定加入購物車按鈕
function bindAddToCart(){
  $$('.product').forEach(card=>{
    const btn = $('.addcart', card);
    btn.addEventListener('click', ()=>{
      const sku = card.dataset.sku;
      const title = $('.product-title', card).textContent.trim();
      const size = $('.chip.on', card)?.dataset.size || '25A';
      const price = Number($('.price .num', card).textContent.replace(/,/g,''));
      CART.add({sku,title,price,size});
    });
  });
}

// 面板開關
function openPanel(id){ $(id).classList.add('show'); }
function closePanel(id){ $(id).classList.remove('show'); }
$('#btn-cart').onclick = ()=> openPanel('#panel-cart');
$('#btn-reviews').onclick = ()=> openPanel('#panel-reviews');
$('#btn-lookup').onclick = ()=> openPanel('#panel-lookup');
$$('[data-close="cart"]').forEach(b=> b.onclick = ()=> closePanel('#panel-cart'));
$$('[data-close="reviews"]').forEach(b=> b.onclick = ()=> closePanel('#panel-reviews'));
$$('[data-close="lookup"]').forEach(b=> b.onclick = ()=> closePanel('#panel-lookup'));
$('#btn-clear').onclick = ()=>{ if(confirm('確定清空購物車？')) CART.empty(); };

// 送出訂單（防呆提示）
$('#checkout').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if (CART.items.length===0){ alert('購物車是空的'); return; }
  if (!$('#agree').checked){ alert('請閱讀並勾選物流須知'); return; }

  const fd = new FormData(e.currentTarget);
  const pay = fd.get('pay') || 'bank';
  const payload = {
    name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'),
    ship: fd.get('ship'), addr: fd.get('addr'), remark: fd.get('remark'),
    payMethod: pay,
    items: CART.items.map(i=>({ title:i.title, weight:'', size:i.size, price:i.price, qty:i.qty })),
    summary: {
      subtotal: CART.items.reduce((s,i)=>s+i.price*i.qty,0),
      shipping: (CART.items.reduce((s,i)=>s+i.price*i.qty,0) >= 1800 ? 0 : 160),
      total: 0
    }
  };
  payload.summary.total = payload.summary.subtotal + payload.summary.shipping;

  const btn = $('#btn-submit'); const hint = $('#submit-hint');
  btn.disabled = true; btn.textContent = '送出訂單中…'; hint.textContent = '請稍候，正在建立訂單（請勿關閉頁面）';

  try{
    const res = await fetch(GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const j = await res.json();

    if (!j.ok){ throw new Error(j.msg||'建立訂單失敗'); }

    // LINE Pay：優先開啟 appUrl；失敗退回 webUrl
    if (pay==='linepay' && j.linepay?.webUrl){
      const appUrl = j.linepay.appUrl;
      try{ location.href = appUrl || j.linepay.webUrl; }
      catch{ location.href = j.linepay.webUrl; }
      // 不清空；待回來後再查詢狀態（此處簡化）
    }else{
      alert('訂單已成立：' + j.order_no + '\n我們會盡快與您聯繫安排出貨。');
      CART.empty(); closePanel('#panel-cart');
    }
  }catch(err){
    alert('送出失敗：'+err.message);
  }finally{
    btn.disabled = false; btn.textContent = '送出訂單'; hint.textContent='';
  }
});

// 查訂單
$('#lookup-go').addEventListener('click', async ()=>{
  const no = ($('#lookup-no').value||'').trim(); if(!no) return;
  $('#lookup-res').textContent = '查詢中…';
  try{
    const url = GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no);
    const j = await fetch(url).then(r=>r.json());
    $('#lookup-res').textContent = j.ok ? JSON.stringify(j,null,2) : ('查無：'+(j.msg||'')); 
  }catch(e){
    $('#lookup-res').textContent = '查詢失敗：'+e.message;
  }
});

// 生成評論 100 則（3⭐ 僅 2 則；日期落在採收期）
function randomDateInSeason(){
  const start = SEASON.start.getTime(), end = SEASON.end.getTime();
  const t = Math.floor(start + Math.random()*(end-start));
  return new Date(t);
}
function pad(n){return String(n).padStart(2,'0')}
function mkReviews(){
  const names = ['陳','林','黃','張','李','王','吳','周','徐','蔡','謝','劉','簡','賴','何','邱','郭','曾','蕭','羅'];
  const words = [
    '甜而不膩，果香乾淨','小孩超愛，連皮都香','剝起來不沾手','冰過更讚','每顆都很穩定','汁水多，做甜點也好吃','回購第三年','老人家牙口也OK','送禮有面子','酸甜平衡剛好','油胞香氣超喜歡','比市場買的更乾淨','物流很快','包裝扎實','批次穩定','家人都說好吃','真的不用挑','今年這批特別好','剛好的成熟度','吃得到陽光味'
  ];
  const wrap = $('#reviews'); wrap.innerHTML='';
  const threeStarIdx = new Set();
  while(threeStarIdx.size<2) threeStarIdx.add(Math.floor(Math.random()*100));
  for(let i=0;i<100;i++){
    const d = randomDateInSeason(); 
    const name = names[Math.floor(Math.random()*names.length)] + '先生';
    const stars = threeStarIdx.has(i) ? 3 : (Math.random()>.45?5:4);
    const text = words[(i+7)%words.length] + (Math.random()>.6?'，會再回購':'');
    const card = document.createElement('div');
    card.className='story-card';
    card.style.minWidth='85%';
    card.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
        <b>${name}</b><span style="color:#f59e0b">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</span>
        <span style="color:#6b7280;font-size:12px">${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}</span>
      </div>
      <p style="margin:6px 0 0">${text}</p>`;
    wrap.appendChild(card);
  }
}

function toast(text){
  const t = $('#toast'); t.textContent = text; t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 1200);
}

// ===== 啟動 =====
document.addEventListener('DOMContentLoaded', ()=>{
  bindSliderArrows('.story-slider');
  bindSliderArrows('.closeups-slider');
  buildMonths();
  renderMeters();
  bindSpecs();
  bindAddToCart();
  CART.load(); updateCartIcon(); renderCart();
  mkReviews();

  // 將量表條的寬度填入
  $$('.bar').forEach(b=>{
    const v = Number(b.dataset.val||0);
    b.firstElementChild && (b.firstElementChild.style.width = v+'%');
  });
});

/* 後端提醒：
   若要避免「Line Pay 失敗但客人收到成立信」，請把 GAS doPost 裡的：
     if (SEND_MAIL) { sendOrderCreatedMail_... }
   移動到「非 linepay」分支，或在 LINE Pay 確認成功後才寄信。
*/
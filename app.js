/* 柑心果園：恢復近拍輪播／產季時間軸／買過都說讚 + 既有購物車互動 */
const GAS_ENDPOINT = window.GAS_ENDPOINT || "";

const $ = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));

/* -------- 商品互動 -------- */
const state = { cart: [] };
function format(n){ return 'NT$ ' + (Number(n)||0).toLocaleString('en-US'); }
function shipFee(sub){ return sub>=1800?0:120; }

function updateDiamMeter(card){
  const sel = $('.js-spec', card);
  const bar = $('.js-diam', card);
  if(!sel || !bar) return;
  const v = sel.value;
  bar.style.width = (v==='23A'?40 : v==='25A'?55 : v==='27A'?70 : 85) + '%';
}
function initProducts(){
  $$('.product-card').forEach(card=>{
    updateDiamMeter(card);
    $('.js-spec', card)?.addEventListener('change', ()=>updateDiamMeter(card));
    const qty = $('.js-qty', card);
    $('.plus', card)?.addEventListener('click', ()=>{ qty.value = Math.max(1,(parseInt(qty.value)||1)+1); });
    $('.minus', card)?.addEventListener('click', ()=>{ qty.value = Math.max(1,(parseInt(qty.value)||1)-1); });
    $('.js-add', card)?.addEventListener('click', ()=>{
      const sku   = card.dataset.sku;
      const title = $('h3', card).textContent.trim();
      const price = Number($('.js-price', card).dataset.base || $('.js-price', card).textContent)||0;
      const spec  = $('.js-spec', card)?.value||'';
      const img   = $('img', card)?.src||'';
      const qtyN  = Math.max(1, parseInt($('.js-qty', card)?.value)||1);
      const f = state.cart.find(i=>i.sku===sku && i.spec===spec);
      if (f) f.qty += qtyN; else state.cart.push({sku,title,price,qty:qtyN,spec,img});
      renderCart();
      toast('已加入購物車');
    });
  });
}

/* -------- 購物車抽屜 -------- */
const cartEl = $('#cart');
function openCart(){ cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden','false'); }
function closeCart(){ cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden','true'); }
function renderCart(){
  const list = $('#cart-list'); list.innerHTML = '';
  let sub = 0;
  state.cart.forEach((it,idx)=>{
    const line = it.price*it.qty; sub += line;
    const row = document.createElement('div');
    row.className='cart-item';
    row.innerHTML = `
      <img src="${it.img}" alt="${it.title}">
      <div>
        <h4>${it.title}</h4>
        <div class="meta">規格：${it.spec}　單價：${format(it.price)}</div>
        <div class="meta">數量：<input type="number" min="1" value="${it.qty}" data-idx="${idx}" class="cart-qty" style="width:70px;margin-left:6px"></div>
      </div>
      <div style="text-align:right">
        <div>${format(line)}</div>
        <button class="btn ghost cart-del" data-idx="${idx}" style="margin-top:6px">刪除</button>
      </div>`;
    list.appendChild(row);
  });
  $$('.cart-qty', list).forEach(inp=>{
    inp.addEventListener('change', e=>{
      const i = +e.target.dataset.idx; const v = Math.max(1, parseInt(e.target.value)||1);
      state.cart[i].qty = v; renderCart();
    });
  });
  $$('.cart-del', list).forEach(btn=>{
    btn.addEventListener('click', e=>{ const i = +e.currentTarget.dataset.idx; state.cart.splice(i,1); renderCart(); });
  });
  const fee = shipFee(sub);
  $('#sum-sub').textContent = format(sub);
  $('#sum-ship').textContent = format(fee);
  $('#sum-total').textContent = format(sub+fee);
}

/* -------- 送單 -------- */
async function submitOrder(ev){
  ev.preventDefault();
  if(!state.cart.length){ alert('購物車是空的'); return; }
  const form = ev.currentTarget;
  const fd = new FormData(form);
  const data = {
    name:(fd.get('name')||'').trim(),
    phone:(fd.get('phone')||'').trim(),
    email:(fd.get('email')||'').trim(),
    addr:(fd.get('addr')||'').trim(),
    remark:(fd.get('remark')||'').trim(),
    ship:'宅配',
    payMethod: (fd.get('pay')==='linepay')?'linepay':'remit',
    items: state.cart.map(it=>({title:it.title,weight:'10斤',size:it.spec,price:it.price,qty:it.qty}))
  };
  if(!data.name || !data.phone || !data.addr){ alert('請完整填寫姓名 / 手機 / 地址'); return; }
  const sub = state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  data.summary = { subtotal:sub, shipping:shipFee(sub), total: sub+shipFee(sub) };

  const btn=$('#btn-submit'), old=btn.textContent; btn.disabled=true; btn.textContent='送出訂單中，請稍候…';
  try{
    const res = await fetch(GAS_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    const j = await res.json();
    if(!j.ok){ alert('送單失敗：'+(j.msg||'未知錯誤')); btn.disabled=false; btn.textContent=old; return; }
    if (j.linepay && j.linepay.webUrl){ window.location.href = j.linepay.webUrl; return; }
    alert('訂單建立成功！訂單編號：'+(j.order_no||'')); state.cart=[]; renderCart(); closeCart(); form.reset();
  }catch(err){ alert('連線失敗：'+err.message); }
  finally{ btn.disabled=false; btn.textContent=old; }
}

/* -------- 通用小提示 -------- */
let toastT=null;
function toast(msg){
  let t=$('#gx-toast'); if(!t){ t=document.createElement('div'); t.id='gx-toast';
    t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.2);z-index:200;font-weight:800;transition:opacity .25s';
    document.body.appendChild(t);
  }
  t.textContent=msg; t.style.opacity='1'; clearTimeout(toastT); toastT=setTimeout(()=>t.style.opacity='0',1500);
}

/* -------- 輪播控制（品牌故事 / 近拍 / 好評） -------- */
function mountCarousel(root){
  if(!root) return;
  const track = $('.track', root); if(!track) return;
  const prev = $('.car-btn.prev', root), next = $('.car-btn.next', root);
  const auto = parseInt(root.dataset.auto||'0');

  const move = dir=>{
    const w = root.clientWidth;
    track.scrollBy({ left: dir*w, behavior:'smooth' });
  };
  prev?.addEventListener('click', ()=>move(-1));
  next?.addEventListener('click', ()=>move(1));

  if (auto>0){
    let timer = setInterval(()=>move(1), auto);
    root.addEventListener('pointerenter', ()=>clearInterval(timer));
    root.addEventListener('pointerleave', ()=>timer = setInterval(()=>move(1), auto));
  }
}

/* -------- 買過都說讚（100 則動態生成） -------- */
function randomReviews(){
  const surnames = '陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱賴周葉蘇徐莊江呂何羅高蕭潘簡朱鍾彭游詹胡施沈余盧梁趙顏柯翁魏方孫戴范宋方馬唐卓'.split('');
  const msgs = [
    '沒吃過這麼好吃的椪柑','孩子超愛，連皮都香','果肉細嫩又多汁','冰過更清爽','送禮超有面子','甜度穩，完全不踩雷',
    '今年品質超穩定','香氣一開箱就撲鼻','連長輩都稱讚','冷藏兩天更好吃','一箱一下就被掃光','客服很貼心',
    '出貨速度快又穩','酸甜剛好不膩','皮超好剝','回購第三年了','家人說比外面買的好太多','價格實在又好吃',
    '油胞香！','果瓣飽滿好分','當果汁也很棒','收到每顆都漂亮','理賠說明清楚放心','熟度拿捏很厲害',
  ];
  const stars = [5,5,5,5,4,5,5,4,5,5,4,5,5,4,5,5,5,4,5,5,4,5,5,5];
  const arr = [];
  const now = new Date(); const year = now.getFullYear();
  const harvestMonths = [10,11,12,1,2,3]; // 採收期
  for(let i=0;i<100;i++){
    const sn = surnames[Math.floor(Math.random()*surnames.length)];
    const msg = msgs[Math.floor(Math.random()*msgs.length)];
    const st  = stars[Math.floor(Math.random()*stars.length)];
    // 產季月份隨機一天
    const m = harvestMonths[Math.floor(Math.random()*harvestMonths.length)];
    const y = (m>=10?year:year+1); // 跨年
    const d = Math.floor(Math.random()*28)+1;
    const date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    arr.push({ who:`${sn}先生`, msg, star:st, date });
  }
  // 只 2 則 3 星
  arr.slice(0,2).forEach(r=>r.star=3);
  return arr;
}
function mountPraise(){
  const panel = $('#praise-panel'), fab = $('#praise-fab'), closeBtn = $('#praise-close');
  fab.addEventListener('click', ()=>panel.classList.add('open'));
  closeBtn.addEventListener('click', ()=>panel.classList.remove('open'));

  const track = $('#praise-track');
  const data = randomReviews();
  track.innerHTML = data.map(r=>`
    <div class="praise-card">
      <div class="who">${r.who}　<span class="date">${r.date}</span></div>
      <div class="stars">${'★'.repeat(r.star)}${'☆'.repeat(5-r.star)}</div>
      <div class="text">${r.msg}</div>
    </div>`).join('');

  mountCarousel(panel.querySelector('.carousel'));
}

/* -------- 啟動 -------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // iOS 輸入避免放大
  $$('input,select,textarea').forEach(el=>{ const fs=parseFloat(getComputedStyle(el).fontSize||'16'); if(fs<16) el.style.fontSize='16px'; });

  // 產品卡
  initProducts(); renderCart();

  // 購物車按鈕
  $('#cart-fab').addEventListener('click', openCart);
  $('#cart-close').addEventListener('click', closeCart);
  $('#cart-clear').addEventListener('click', ()=>{ if(confirm('確定要清空購物車嗎？')){ state.cart=[]; renderCart(); } });
  $('#checkout').addEventListener('submit', submitOrder);

  // 輪播們
  $$('.carousel').forEach(mountCarousel);
  mountPraise();
});
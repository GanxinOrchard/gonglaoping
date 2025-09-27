/* ===== 極小入侵：在不改你區塊結構下，補互動＋修手機穩定 ===== */

// —— 小工具
const $ = (sel, el=document)=>el.querySelector(sel);
const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
const fmt = n => 'NT$ ' + (Number(n)||0).toLocaleString('en-US');

// ====== 導覽與位置調整 ======
(function fixOrderAndHero(){
  // 品牌故事橫向滑動（兩側箭頭）
  $$('[data-slider]').forEach(wrap=>{
    const prev = $('[data-prev]', wrap);
    const next = $('[data-next]', wrap);
    if(prev) prev.addEventListener('click', ()=> wrap.scrollBy({left:-320, behavior:'smooth'}));
    if(next) next.addEventListener('click', ()=> wrap.scrollBy({left: 320, behavior:'smooth'}));
  });

  // 滾到最上方時，免運條不抖動
  const bar = $('#freeShipBar');
  let last = 0;
  document.addEventListener('scroll', ()=>{
    const y = window.scrollY||0;
    if(Math.abs(y-last)>8){ bar.style.willChange = 'transform'; last = y; clearTimeout(bar._t); bar._t=setTimeout(()=>bar.style.willChange='auto',200); }
  });
})();

// ====== 規格切換：同步尺寸（不動你 HTML，只更新文字） ======
(function bindSpecs(){
  $$('.specs').forEach(box=>{
    const diamEl = box.closest('.good-body').querySelector('.diam-val');
    box.addEventListener('click', (e)=>{
      const btn = e.target.closest('.spec'); if(!btn) return;
      $$('.spec', box).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const d = btn.getAttribute('data-diam');
      if(d && diamEl) diamEl.textContent = d;
    });
  });
})();

// ====== 購物車（右側浮動） ======
const cart = {
  list: [],
  coupon: null,
  ship: 0,
  get subtotal(){ return this.list.reduce((s,i)=>s+i.price*i.qty,0) },
  get discount(){
    if(!this.coupon) return 0;
    if(this.coupon.type==='flat') return Math.min(this.subtotal, this.coupon.value);
    if(this.coupon.type==='percent') return Math.round(this.subtotal * (1-this.coupon.value));
    return 0;
  },
  get shipping(){ return (this.subtotal - this.discount)>=1800 ? 0 : 160 },
  get total(){ return Math.max(0, this.subtotal - this.discount + this.shipping) }
};

// 折扣碼（含有效期）
const coupons = {
  'OR-200': { type:'flat', value:200, expire:'2099-12-31' },
  'OR-90' : { type:'percent', value:0.9, expire:'2099-12-31' } // 9 折
};
function isValidCoupon(code){
  const c = coupons[code]; if(!c) return null;
  const today = new Date().toISOString().slice(0,10);
  return (today <= c.expire) ? c : null;
}

// 讀寫本機（記憶功能）
const cache = {
  load(){
    try{
      const o = JSON.parse(localStorage.getItem('gx_cart')||'{}');
      if(o.list) cart.list = o.list;
      if(o.coupon) cart.coupon = o.coupon;
      const form = JSON.parse(localStorage.getItem('gx_form')||'{}');
      for(const [k,v] of Object.entries(form)){
        const el = document.querySelector(`[name="${k}"]`); if(el) el.value = v;
      }
    }catch{}
  },
  save(){
    localStorage.setItem('gx_cart', JSON.stringify({list:cart.list, coupon:cart.coupon}));
    const form = {};
    ['name','phone','email','addr','remark'].forEach(n=>{
      const el = document.querySelector(`[name="${n}"]`); if(el) form[n]=el.value||'';
    });
    localStorage.setItem('gx_form', JSON.stringify(form));
  },
  clear(){ localStorage.removeItem('gx_cart') }
};
cache.load();

const cartPanel = $('#cartPanel');
$('#btnCart').addEventListener('click', ()=> cartPanel.classList.add('open'));
$('#btnClose').addEventListener('click', ()=> cartPanel.classList.remove('open'));
$('#btnClear').addEventListener('click', ()=>{ cart.list=[]; cart.coupon=null; drawCart(); cache.save(); });

// 加入購物車（不自動打開；改 toast）
$$('[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const card = btn.closest('.good');
    const qty = Number($('.qty', card).value)||1;
    const title = btn.dataset.title;
    const price = Number(btn.dataset.price)||0;
    const pid = btn.dataset.id;
    const specActive = $('.spec.active', card);
    const size = specActive ? specActive.dataset.size : '';
    const itemKey = pid + '|' + size;

    const exist = cart.list.find(i=>i.key===itemKey);
    if(exist){ exist.qty += qty; } else {
      cart.list.push({key:itemKey, title, price, qty, size});
    }
    drawCart(); cache.save();
    toast('已加入購物車');
  });
});

// 數量 +/-
$$('.qbtn[data-plus]').forEach(b=>{
  b.addEventListener('click', ()=>{ const q=b.closest('.qty-line').querySelector('.qty'); q.value = Math.min(99, Number(q.value||1)+1); });
});
$$('.qbtn[data-minus]').forEach(b=>{
  b.addEventListener('click', ()=>{ const q=b.closest('.qty-line').querySelector('.qty'); q.value = Math.max(1, Number(q.value||1)-1); });
});

function drawCart(){
  const ul = $('#cartList'); ul.innerHTML='';
  cart.list.forEach((it, idx)=>{
    const li = document.createElement('li'); li.className='cart-item';
    li.innerHTML = `
      <div><b>${escapeHtml(it.title)}</b> <small>${it.size||''}</small></div>
      <div>${fmt(it.price)} × ${it.qty}</div>
      <button class="rm">移除</button>
    `;
    $('.rm', li).addEventListener('click', ()=>{ cart.list.splice(idx,1); drawCart(); cache.save(); });
    ul.appendChild(li);
  });

  // 金額
  $('#sumSubtotal').textContent = fmt(cart.subtotal);
  $('#sumShipping').textContent = fmt(cart.shipping);
  $('#sumTotal').textContent = fmt(cart.total);

  // 套用中的折扣碼
  if(cart.coupon){
    $('#couponInput').value = cart.coupon.code;
  } else {
    $('#couponInput').value = '';
  }

  // 若有勾選物流須知才可送單
  const ok = $('#agreeShip').checked && cart.list.length>0;
  $('#btnSubmit').disabled = !ok;
}
drawCart();

$('#agreeShip').addEventListener('change', drawCart);
$('#applyCoupon').addEventListener('click', ()=>{
  const code = ($('#couponInput').value||'').trim().toUpperCase();
  const c = isValidCoupon(code);
  if(!c){ toast('折扣碼無效或已過期'); cart.coupon=null; }
  else { cart.coupon = {...c, code}; toast('已套用折扣碼'); }
  drawCart(); cache.save();
});

// 評價面板（左側同步大小）
const panelReviews = $('#panelReviews');
$('#btnReviews').addEventListener('click', ()=> panelReviews.classList.add('open'));
$('#closeReviews').addEventListener('click', ()=> panelReviews.classList.remove('open'));

// 生成 100 則不重複評價（產季期間的日期；每年自動）
(function buildReviews(){
  const names = ['陳','林','黃','張','李','王','吳','劉','蔡','楊','許','鄭','謝','周','葉','蘇','曾','呂','洪','何','高','蕭','潘','簡','朱','鍾','彭','莊','顏','傅','方','唐','陸','程','羅','馬','姚','阮','姜','杜'];
  const given = ['先生','小姐','媽媽','爸比','阿嬤','阿公','主廚','老師'];
  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)] }
  function randDate(){
    const y = new Date().getFullYear();
    const months = [10,11,12,1,2,3,4]; // 產季區間
    const m = months[Math.floor(Math.random()*months.length)];
    const d = Math.floor(Math.random()*27)+1;
    const realY = (m>=10? y : y+0);
    const str = new Date(realY, m-1, d);
    return `${str.getFullYear()}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
  }
  const lines = [
    '沒吃過這麼好吃的椪柑','茂谷多汁又細嫩','孩子超愛，一天兩顆','香氣真的濃！','甜而不膩，冰過更讚','每顆都很穩定','果皮好剝，長輩喜歡','送禮有面子','口感 Q 彈','一打開就是橙香','物流快，新鮮度棒','果肉完整，不亂滴','酸甜平衡','油胞香氣好療癒','價格實在','家人都說要回購','比市場買到的更漂亮','每顆都很實在','補充維C 就靠它','朋友收到了直說好吃','冷藏隔天更甜','現剝現吃太幸福','孩子便當水果首選','果肉細緻沒渣','產地直送有差','早鳥免運太香','批次穩，不踩雷','年節送禮剛好','剝開就分瓣','每年都等你們開賣'
  ];
  const ul = $('#reviewsList'); const dots = $('#reviewsDots');
  for(let i=0;i<100;i++){
    const star = (i===12 || i===61)? 3 : (4 + Math.round(Math.random())); // 兩則 3 星，其餘 4~5
    const name = rand(names)+rand(given);
    const text = lines[(i*7)%lines.length] + (i%5===0 ? '！' : ''); // 做輕微變化
    const li = document.createElement('li'); li.className='review';
    li.innerHTML = `
      <div class="rhd"><span>${name}</span><span class="stars">${'★'.repeat(star)}${'☆'.repeat(5-star)}</span></div>
      <div class="rbd">${escapeHtml(text)}</div>
      <div class="rft"><small>${randDate()}</small></div>
    `;
    ul.appendChild(li);
  }
  // 分頁點（每頁 5 則）
  const pages = Math.ceil(100/5);
  for(let p=0;p<pages;p++){
    const b = document.createElement('button');
    if(p===0) b.classList.add('active');
    b.addEventListener('click', ()=>{
      $$('#reviewsDots button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const top = p*5;
      $$('#reviewsList .review').forEach((li,idx)=>{
        li.style.display = (idx>=top && idx<top+5)? 'block':'none';
      });
    });
    dots.appendChild(b);
  }
  // 初始只顯示前 5
  $$('#reviewsList .review').forEach((li,idx)=>{ if(idx>=5) li.style.display='none'; });
})();

// ====== 送單（前端防呆：顯示「送出中」；Line Pay 先跳再清空） ======
$('#orderForm').addEventListener('input', ()=> cache.save());
$('#orderForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(cart.list.length===0){ toast('購物車是空的'); return; }
  if(!$('#agreeShip').checked){ toast('請先閱讀並同意物流須知'); return; }

  const pay = $('input[name="pay"]:checked').value;
  const form = Object.fromEntries(new FormData($('#orderForm')).entries());
  const payload = {
    name: form.name, phone: form.phone, email: form.email,
    addr: form.addr, remark: form.remark||'',
    items: cart.list.map(i=>({title:i.title, price:i.price, qty:i.qty, size:i.size})),
    summary: { subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total },
    ship: '宅配', payMethod: pay
  };

  // 防連點
  const btn = $('#btnSubmit'); const hint = $('#submitHint');
  btn.disabled = true; hint.hidden = false; hint.textContent = '送出訂單中，請稍候…';

  try{
    const res = await fetch(GAS_ENDPOINT, {method:'POST', body:JSON.stringify(payload)});
    const json = await res.json();

    if(!json.ok){ throw new Error(json.msg || '訂單建立失敗'); }

    if(pay==='linepay' && json.linepay && (json.linepay.appUrl || json.linepay.webUrl)){
      // 手機優先開 APP，否則開 web；成功由 LINE Pay 回呼頁面（GAS）處理
      const appUrl = json.linepay.appUrl;
      const webUrl = json.linepay.webUrl;
      if(appUrl){
        location.href = appUrl;
        setTimeout(()=>{ window.open(webUrl, '_blank'); }, 800);
      }else{
        window.open(webUrl, '_blank');
      }
      toast('已前往 LINE Pay'); // 不立即清空，等你回來再自行刷新
    }else{
      // 匯款或沒有 linepay 連結：視為成功
      toast('下單成功！已寄出信件');
      cart.list = []; cart.coupon=null; drawCart(); cache.save();
    }
  }catch(err){
    toast('送出失敗：' + err.message);
  }finally{
    btn.disabled = false; hint.hidden = true;
  }
});

// 訂單查詢（浮動放大鏡）
$('#btnLookup').addEventListener('click', async ()=>{
  const orderNo = prompt('請輸入訂單編號（如：K25-20250101-1234）');
  if(!orderNo) return;
  try{
    const url = GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(orderNo);
    const r = await fetch(url); const j = await r.json();
    if(!j.ok){ alert('查無資料：' + (j.msg||'')); return; }
    alert(`${j.orderNo}\n狀態：${j.shipStatus||'-'}\n金額：${fmt(j.total||0)}\n物流單號：${j.trackingNo||'-'}`);
  }catch(e){ alert('查詢失敗'); }
});

// 小吐司
function toast(msg){
  let el = $('#toast'); if(!el){ el = document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = msg; el.className = 'show';
  setTimeout(()=> el.className='', 1400);
}
const cssToast = document.createElement('style');
cssToast.textContent = `#toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:999px;font-weight:900;opacity:0;transition:.3s;z-index:2000}
#toast.show{opacity:1}`;
document.head.appendChild(cssToast);

// HTML escape
function escapeHtml(s){ return String(s||'').replace(/[<>&"]/g,c=>({ '<':'&lt;','>':'&gt;','&':'&quot;' }[c])) }
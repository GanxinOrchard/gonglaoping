/* ========================
   柑心果園｜前端主程式
   ======================== */

// ★★★ 改這裡：Google Apps Script Endpoint
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec";

// ---------- 公用 ----------
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const fmt = n => 'NT$ ' + (Number(n)||0).toLocaleString('en-US');
const smoothGo = target => {
  const el = typeof target==='string' ? $(target) : target;
  if (el) el.scrollIntoView({behavior:'smooth',block:'start'});
};

// ---------- 規格/量表（可調） ----------
const SPEC_MAP = {
  "23A": { size: "約 6.2–6.6 cm", sweet: 65, acid: 35, aroma: 55, price: 760 },
  "25A": { size: "約 6.5–7.0 cm", sweet: 70, acid: 35, aroma: 60, price: 780 },
  "27A": { size: "約 7.0–7.5 cm", sweet: 75, acid: 30, aroma: 65, price: 820 },
  "30A": { size: "約 7.5–8.0 cm", sweet: 78, acid: 28, aroma: 70, price: 860 }
};
// 各品種可微調（覆蓋）
const KIND_TWEAK = {
  ponkan: { basePrice: 780, adjust: { "23A":-20, "27A":40, "30A":80 } },
  murcott:{ basePrice: 880, adjust: { "23A":-40, "27A":20, "30A":60 } }
};

// 初始化產品卡
function initProducts(){
  $$('.product-card').forEach(card=>{
    const kind = card.dataset.kind;
    const bars = {
      sweet: card.querySelector('.bar-fill#'+kind+'Sweet'),
      acid:  card.querySelector('.bar-fill#'+kind+'Acid'),
      aroma: card.querySelector('.bar-fill#'+kind+'Aroma')
    };
    const sizeEl = $('#'+kind+'Size');
    const priceEl = $('#'+kind.charAt(0).toUpperCase()+kind.slice(1)+'Price') || card.querySelector('.price b');

    const setSpec = (spec) =>{
      const base = SPEC_MAP[spec];
      const tweak = KIND_TWEAK[kind] || { basePrice: 0, adjust:{} };
      const price = (tweak.basePrice||0) + (tweak.adjust?.[spec]||0);
      bars.sweet.style.width = base.sweet + '%';
      bars.acid.style.width  = base.acid + '%';
      bars.aroma.style.width = base.aroma + '%';
      sizeEl.textContent = base.size;
      priceEl.textContent = price;
      card.dataset.spec = spec;
    };

    // 規格切換
    card.querySelectorAll('.spec-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        card.querySelectorAll('.spec-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        setSpec(btn.dataset.spec);
      });
    });

    // 預設
    setSpec('25A');

    // 加入購物車
    card.querySelector('.btn.buy').addEventListener('click', ()=>{
      const title = card.querySelector('.product-title').textContent.trim();
      const spec = card.dataset.spec || '25A';
      const price = Number(card.querySelector('.price b').textContent.replace(/[^\d]/g,'')) || 0;
      addCart({ sku: kind+'-'+spec, title, spec, price, qty:1, weight:'10台斤' });
      openCart();
    });
  });
}

// ---------- 產季時間軸（橫向小卡） ----------
function makeSeasonRow(el, months, note){
  months.forEach(m=>{
    const card = document.createElement('div');
    card.className = 'season-card';
    const ball = document.createElement('div');
    ball.className = 'season-ball';
    ball.style.background = `linear-gradient(160deg, ${m.c1}, ${m.c2})`;
    card.innerHTML = `
      <div class="season-month">${m.m} 月</div>
      <div class="season-note">${note}</div>
    `;
    card.insertBefore(ball, card.firstChild);
    el.appendChild(card);
  });
}
function initSeason(){
  // 椪柑 10–4（顏色綠→橘）
  const ponkan = [];
  const colors = [
    ['#9ae6b4','#7cc957'], // 10
    ['#a6e9a9','#89cf54'],
    ['#d1e98a','#e0b24c'],
    ['#f9cf6b','#f59e0b'],
    ['#f7b84c','#f08a00'],
    ['#f6a531','#f08a00'], // 3
    ['#f39a22','#f08a00']  // 4
  ];
  [10,11,12,1,2,3,4].forEach((m,i)=>ponkan.push({m, c1:colors[i][0], c2:colors[i][1]}));
  makeSeasonRow($('#seasonPonkan'), ponkan, '椪柑');

  // 茂谷 12–3
  const mur = [];
  const c2 = [['#e8f59a','#f59e0b'],['#f7c85a','#f59e0b'],['#f7b84c','#f59e0b'],['#f39a22','#f59e0b']];
  [12,1,2,3].forEach((m,i)=>mur.push({m, c1:c2[i][0], c2:c2[i][1]}));
  makeSeasonRow($('#seasonMurcott'), mur, '茂谷');
}

// ---------- 故事滑動 ----------
let storyIndex=0;
function storyMove(dir){
  const track = $('#storyTrack');
  const cards = $$('.story-card', track);
  storyIndex = (storyIndex + dir + cards.length) % cards.length;
  track.style.transform = `translateX(-${storyIndex * (track.clientWidth)}px)`;
  track.style.transition = 'transform .28s ease';
}

// ---------- 浮動：評價 50 則 ----------
const REVIEWS = (()=> {
  const names = ['佳蓉','育廷','小葳','阿倫','冠廷','Iris','王sir','小庭','宥嘉','小P','Pei','小郭','阿宏','Nana','小米','庭妤','沛沛','哲瑋','宸安','Yoyo','Maggie','Annie','家瑜','派派','思妤','廷筠','Celine','木木','廷安','品妤','Amber','阿政','Roy','Ava','小于','Rita','滾滾','Mika','怡君','志安','Han','Coco','昭瑩','Jill','Duke','Yen','Lynn','芸芸','方少'];
  const texts = [
    '冷藏後更清爽，小孩超愛。','每一顆都很完整，甜中帶香。','果肉細嫩多汁，回購第二次！',
    '酸甜剛好，配早餐超讚。','送禮很體面，收件人說很甜。','開箱有錄影，理賠說明很清楚。',
    '剝皮超好剝，長輩吃很方便。','比超市好吃太多了。','汁多到爆，做果汁剛好。',
    '這批特別香，推！','客服很貼心，幫我避開出國日期。','孩子說這是「會笑的橘子」。',
    '箱子很漂亮，打開就有柑香。','甜度穩定沒踩雷。','果皮有油胞香，很新鮮。'
  ];
  // 產季期間日期
  const dates = [];
  const now = new Date();
  const year = now.getFullYear();
  function pushRange(y, arrMonths){
    arrMonths.forEach(m=>{
      const d = new Date(y, m-1, Math.min(25, Math.floor(Math.random()*25)+1));
      dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    });
  }
  pushRange(year-1,[10,11,12]); pushRange(year,[1,2,3,4,12]); pushRange(year+1,[1,2,3]);
  const list=[];
  for(let i=0;i<50;i++){
    list.push({
      name: names[i % names.length],
      text: texts[i % texts.length],
      date: dates[i % dates.length]
    });
  }
  return list;
})();
let rvIndex=0, rvTimer=null;
function renderReviews(){
  const ul = $('#reviewsTrack'); ul.innerHTML='';
  REVIEWS.forEach(r=>{
    const li = document.createElement('li');
    li.className='review-item';
    li.innerHTML = `
      <div class="review-top"><b>🍊 ${r.name}</b><span class="review-date">${r.date}</span></div>
      <div>${r.text}</div>`;
    ul.appendChild(li);
  });
  startReviewsAuto();
}
function startReviewsAuto(){
  stopReviewsAuto();
  rvTimer = setInterval(()=>reviewsMove(1), 2800);
}
function stopReviewsAuto(){ if (rvTimer){ clearInterval(rvTimer); rvTimer=null; } }
function reviewsMove(dir){
  rvIndex = (rvIndex + dir + REVIEWS.length) % REVIEWS.length;
  $('#reviewsTrack').style.transform = `translateX(-${rvIndex*280}px)`;
  $('#reviewsTrack').style.transition = 'transform .35s ease';
}
function openReviews(){ openDrawer('reviewsDrawer'); startReviewsAuto(); }

// ---------- 抽屜通用 ----------
function openDrawer(id){ const el = $('#'+id); el?.setAttribute('aria-hidden','false'); }
function closeDrawer(id){ const el = $('#'+id); el?.setAttribute('aria-hidden','true'); if(id==='reviewsDrawer') stopReviewsAuto(); }
function openOrderSearch(){ openDrawer('searchDrawer'); $('#qOrder').focus(); }
function openCart(){ openDrawer('cartDrawer'); }

// ---------- 購物車 ----------
const CART_KEY='gx_cart_v1', FORM_KEY='gx_form_v1';
let cart = JSON.parse(localStorage.getItem(CART_KEY)||'[]');
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); }
function addCart(it){
  const exist = cart.find(x=>x.sku===it.sku);
  if (exist) exist.qty += it.qty; else cart.push(it);
  saveCart(); bumpCartCount();
}
function bumpCartCount(){ $('#cartCount').textContent = cart.reduce((s,x)=>s+x.qty,0); }
function renderCart(){
  const ul = $('#cartList'); ul.innerHTML='';
  cart.forEach((it,i)=>{
    const li = document.createElement('li');
    li.className='cart-item';
    li.innerHTML = `
      <div>${it.title}｜${it.spec}<br><small>${it.weight}</small></div>
      <div class="qty">
        <button onclick="chgQty(${i},-1)">－</button>
        <b>${it.qty}</b>
        <button onclick="chgQty(${i},1)">＋</button>
      </div>
      <div><b>${fmt(it.price*it.qty)}</b></div>`;
    ul.appendChild(li);
  });
  const subtotal = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const shipping = subtotal>=2000||subtotal===0?0:150;
  $('#sumSubtotal').textContent = fmt(subtotal);
  $('#sumShipping').textContent = fmt(shipping);
  $('#sumTotal').textContent = fmt(subtotal+shipping);
  bumpCartCount();
}
function chgQty(i, d){
  cart[i].qty = Math.max(0, cart[i].qty + d);
  if (cart[i].qty===0) cart.splice(i,1);
  saveCart();
}
function clearCart(){ cart=[]; saveCart(); }

// 表單記憶
function loadForm(){
  const mem = JSON.parse(localStorage.getItem(FORM_KEY)||'{}');
  ['name','phone','email','addr','remark'].forEach(id=>{ if(mem[id]) $('#'+id).value = mem[id]; });
  if (mem.ship) $$('input[name=ship]').forEach(r=>{ if(r.value===mem.ship) r.checked=true; });
  if (mem.pay)  $$('input[name=pay]').forEach(r=>{ if(r.value===mem.pay)  r.checked=true; });
}
function saveForm(){
  const m = {
    name:$('#name').value.trim(),
    phone:$('#phone').value.trim(),
    email:$('#email').value.trim(),
    addr:$('#addr').value.trim(),
    remark:$('#remark').value.trim(),
    ship:($$('input[name=ship]:checked')[0]||{}).value||'宅配',
    pay: ($$('input[name=pay]:checked')[0]||{}).value||'bank'
  };
  localStorage.setItem(FORM_KEY, JSON.stringify(m));
}
$$('.cart-form input, .cart-form textarea').forEach(el=> el?.addEventListener('change', saveForm));
$$('input[name=ship], input[name=pay]').forEach(el=> el?.addEventListener('change', saveForm));

// 送單／Line Pay
async function checkout(payMethod){
  if (cart.length===0){ alert('購物車是空的'); return; }
  if (!$('#agree').checked){ alert('請先展開並勾選「物流須知」'); return; }

  const form = JSON.parse(localStorage.getItem(FORM_KEY)||'{}');
  if (!form.name || !form.phone){ alert('請填姓名與手機'); return; }
  if (form.ship==='宅配' && !form.addr){ alert('宅配請填收件地址'); return; }

  const payload = {
    name:form.name, phone:form.phone, email:form.email||'',
    ship:form.ship, addr:form.addr||'', remark:form.remark||'',
    items: cart.map(x=>({title:x.title, weight:x.weight, size:x.spec, price:x.price, qty:x.qty})),
    summary: calcSummary(),
    payMethod: (payMethod==='linepay' ? 'linepay' : 'bank')
  };

  try{
    const res = await fetch(GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const json = await res.json();

    if (!json.ok){ throw new Error(json.msg||'下單失敗'); }

    if (payMethod==='linepay' && json.linepay){
      // 先試 appUrl（Line App），失敗回 webUrl
      const appUrl = json.linepay.appUrl, webUrl = json.linepay.webUrl;
      // iOS/Safari 直接替換避免回不來
      const jump = appUrl || webUrl;
      if (jump){ window.location.href = jump; return; }
    }

    alert('訂單已送出：' + json.order_no);
    clearCart();
    closeDrawer('cartDrawer');
  }catch(err){
    alert('發生錯誤：' + err.message);
  }
}
function calcSummary(){
  const subtotal = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const shipping = subtotal>=2000||subtotal===0?0:150;
  return { subtotal, shipping, total: subtotal+shipping };
}

// 訂單查詢
async function searchOrder(){
  const no = $('#qOrder').value.trim();
  if (!no){ alert('請輸入訂單編號'); return; }
  try{
    const url = GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no);
    const res = await fetch(url);
    const j = await res.json();
    if (!j.ok) throw new Error(j.msg||'查無資料');
    $('#orderResult').textContent = JSON.stringify(j,null,2);
  }catch(e){
    $('#orderResult').textContent = '查詢失敗：' + e.message;
  }
}

// --------- 啟動 ----------
document.addEventListener('DOMContentLoaded', ()=>{
  initProducts();
  initSeason();
  renderReviews();
  renderCart(); loadForm();
});
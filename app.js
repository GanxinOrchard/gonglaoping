/* ========= 柑心果園 app.js（微調版） ========= */

/** 簡易工具 */
const $ = (sel, ctx=document)=>ctx.querySelector(sel);
const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

/** ====== 品牌故事輪播 ====== */
(function storySlider(){
  const wrap = $('.story-carousel');
  if(!wrap) return;
  const track = $('.story-track', wrap);
  const cards = $$('.story-card', track);
  let idx = 0;
  function go(i){
    idx = (i+cards.length)%cards.length;
    track.scrollTo({ left: wrap.clientWidth*idx, behavior:'smooth' });
  }
  $('.story-arrow.prev', wrap).onclick = ()=>go(idx-1);
  $('.story-arrow.next', wrap).onclick = ()=>go(idx+1);
})();

/** ====== 果實近拍輪播 ====== */
(function closeupSlider(){
  const wrap = $('#closeup .carousel');
  if(!wrap) return;
  const track = $('.c-track', wrap);
  const items = $$('.c-item', track);
  let idx = 0;
  function go(i){
    idx = (i+items.length)%items.length;
    track.scrollTo({ left: wrap.clientWidth*idx, behavior:'smooth' });
  }
  $('.c-arrow.prev', wrap).onclick = ()=>go(idx-1);
  $('.c-arrow.next', wrap).onclick = ()=>go(idx+1);
})();

/** ====== 甜度/酸度/香氣（條狀圖 with 規格） ====== */
const specMap = {
  ponkan: { // 椪柑
    base: { sweet:.8, acid:.35, aroma:.7 },
    size: { '23A':'直徑約 7.0–7.5 cm', '25A':'直徑約 7.6–8.0 cm','27A':'直徑約 8.1–8.5 cm','30A':'直徑約 8.6–9.0 cm' }
  },
  maogu: { // 茂谷
    base: { sweet:.85, acid:.4, aroma:.8 },
    size: { '23A':'直徑約 6.8–7.3 cm', '25A':'直徑約 7.4–7.9 cm','27A':'直徑約 8.0–8.4 cm','30A':'直徑約 8.5–9.0 cm' }
  }
};

function updateMeters(card, key){
  const sel = $('.spec', card);
  const v = sel?.value || '25A';
  const base = specMap[key].base;
  const adj = (v==='23A'? -0.05 : v==='27A'? +0.03 : v==='30A'? +0.05 : 0);
  $$('.bar', card).forEach(bar=>{
    const k = bar.dataset.k; const val = Math.max(.05, Math.min(1, base[k] + adj));
    bar.style.setProperty('--val', val);
    bar.style.transform = `scaleX(1)`;
    // 用 after 來顯示長度
    bar.style.setProperty('--after-scale', String(val));
    bar.style.setProperty('--w', (val*100).toFixed(0) + '%');
    bar.style.setProperty('--x', val);
    bar.style.setProperty('--_v', val);
    bar.style.setProperty('--_s', (0.2 + 0.8*val));
    bar.style.setProperty('--_perc', (val*100).toFixed(0));
    bar.style.setProperty('clip-path', `inset(0 ${(1-val)*100}% 0 0)`);
  });
  // 將尺寸文字同步到 select option（已寫在 option 內）
}

function initMeters(){
  $$('.card').forEach(card=>{
    const sel = $('.spec', card); if(!sel) return;
    const key = sel.dataset.product; if(!specMap[key]) return;
    sel.addEventListener('change', ()=>updateMeters(card, key));
    updateMeters(card, key);
  });
}
document.addEventListener('DOMContentLoaded', initMeters);

/** ====== 浮動面板（購物車 / 評論） ====== */
const cartPanel = $('#cartPanel');
const reviewsPanel = $('#reviewsPanel');
$('.cart-toggle')?.addEventListener('click', ()=>cartPanel?.classList.toggle('open'));
$('.reviews-toggle')?.addEventListener('click', ()=>reviewsPanel?.classList.toggle('open'));
$('.close-cart')?.addEventListener('click', ()=>cartPanel?.classList.remove('open'));
$('.clear-cart')?.addEventListener('click', ()=>clearCart());
$('.reviews .close')?.addEventListener('click', ()=>reviewsPanel?.classList.remove('open'));

/** ====== 加入購物車（不自動開購物車；顯示 toast） ====== */
const toast = $('#toast');
function showToast(msg){
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 1500);
}

const CART_KEY = 'gx_cart_v1';
function getCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(_){return[]} }
function saveCart(d){ localStorage.setItem(CART_KEY, JSON.stringify(d)); renderCart(); }

function addToCart(btn){
  const id = btn.dataset.id;
  const title = btn.dataset.title;
  const price = Number(btn.dataset.price)||0;
  const card = btn.closest('.card');
  const spec = $('.spec', card)?.value || '';
  const itemKey = id + '|' + spec;

  const cart = getCart();
  const found = cart.find(x=>x.key===itemKey);
  if(found){ found.qty += 1; } else {
    cart.push({ key:itemKey, id, title, spec, price, qty:1 });
  }
  saveCart(cart);
  showToast('已加入購物車');
}
$$('.btn.add').forEach(b=>b.addEventListener('click', e=>addToCart(e.currentTarget)));

/** ====== 購物車渲染 ====== */
const elItems = $('.cart-items');
const elSubtotal = $('#sumSubtotal');
const elShipping = $('#sumShipping');
const elDiscount = $('#sumDiscount');
const elTotal = $('#sumTotal');

function renderCart(){
  const cart = getCart();
  if(!elItems) return;

  elItems.innerHTML = cart.length ? '' : '<div class="muted">購物車是空的</div>';
  let subtotal = 0;
  cart.forEach((it, idx)=>{
    subtotal += it.price * it.qty;
    const row = document.createElement('div');
    row.className = 'ci';
    row.innerHTML = `
      <div class="ci-title">${it.title}｜${it.spec}</div>
      <div class="ci-ctrl">
        <button class="qbtn minus">–</button>
        <span class="qty">${it.qty}</span>
        <button class="qbtn plus">＋</button>
        <b class="amt">NT$ ${(it.price*it.qty).toLocaleString()}</b>
        <button class="qbtn del">移除</button>
      </div>`;
    $('.minus',row).onclick = ()=>{ if(it.qty>1){ it.qty--; saveCart(cart); } };
    $('.plus',row).onclick = ()=>{ it.qty++; saveCart(cart); };
    $('.del',row).onclick = ()=>{ cart.splice(idx,1); saveCart(cart); };
    elItems.appendChild(row);
  });

  // 運費：滿 1800 免運，否則 150（你可改）
  const shipping = subtotal>=1800 ? 0 : (subtotal>0 ? 150 : 0);

  // 折扣：由 coupon 計算（render 時重算）
  const { discount } = getDiscount(subtotal);

  const total = Math.max(0, subtotal + shipping - discount);

  elSubtotal.textContent = 'NT$ ' + subtotal.toLocaleString();
  elShipping.textContent = 'NT$ ' + shipping.toLocaleString();
  elDiscount.textContent = '- NT$ ' + discount.toLocaleString();
  elTotal.textContent = 'NT$ ' + total.toLocaleString();

  // 當同意勾選且購物車有品項才可送出
  $('#btnSubmit').disabled = !( $('#agreeRules')?.checked && cart.length>0 );
}
renderCart();

$('#agreeRules')?.addEventListener('change', renderCart);

/** ====== 折扣碼（GX200OFF / GX10OFF；過期不可用；當季限定） ====== */
const COUPON_KEY='gx_coupon_v1';
function setCoupon(code){ localStorage.setItem(COUPON_KEY, (code||'').trim().toUpperCase()); renderCart(); }
function getCoupon(){ return (localStorage.getItem(COUPON_KEY)||'').toUpperCase(); }

function inSeason(){
  const m = new Date().getMonth()+1; // 1-12
  // 椪柑 10-4；茂谷 12-3 → 簡化：10~4 視為當季
  return (m>=10 || m<=4);
}
// 今年 4/30 到期
function notExpired(){
  const now = new Date();
  const end = new Date(now.getFullYear(), 3, 30, 23,59,59); // 月份 0-based
  return now <= end;
}
function getDiscount(subtotal){
  const code = getCoupon();
  let discount = 0, msg='';
  if(!code) return {discount, msg};
  if(!inSeason()) { msg='非當季，折扣碼無法使用'; return {discount, msg}; }
  if(!notExpired()) { msg='折扣碼已過期'; return {discount, msg}; }

  if(code==='GX200OFF'){
    discount = Math.min(200, subtotal);
    msg = discount>0 ? '已套用：現折 200' : '金額不足以折抵';
  }else if(code==='GX10OFF'){
    discount = Math.round(subtotal * 0.1);
    msg = discount>0 ? '已套用：九折優惠' : '金額不足以折抵';
  }else{
    msg='無效的折扣碼';
  }
  return {discount, msg};
}
$('#applyCoupon')?.addEventListener('click', ()=>{
  const code = $('#coupon').value.trim().toUpperCase();
  setCoupon(code);
  const { msg, discount } = getDiscount( (getCart().reduce((s,i)=>s+i.price*i.qty,0)) );
  const box = $('#couponMsg');
  if(box){
    box.textContent = msg || (discount>0?'已套用':'');
    box.className = 'coupon-msg ' + (discount>0?'ok':'err');
  }
});
$('#coupon')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#applyCoupon').click(); }});

/** ====== 送出訂單（防呆：顯示「送出訂單中，請稍候…」） ====== */
const GAS = (typeof window!=='undefined' && window.GAS_ENDPOINT) || '';
$('#checkoutForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const btn = $('#btnSubmit'); const hint = $('#submitHint');
  if(btn) { btn.disabled = true; btn.textContent = '送出訂單中，請稍候…'; }
  if(hint) hint.textContent = '系統處理中，請不要關閉此頁面';

  try{
    const cart = getCart();
    if(!cart.length) throw new Error('購物車是空的');

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name')||'',
      email: fd.get('email')||'',
      phone: fd.get('phone')||'',
      ship: fd.get('ship')||'宅配',
      addr: fd.get('addr')||'',
      remark: fd.get('remark')||'',
      items: cart.map(it=>({ title: it.title, weight:'10斤', size: it.spec, price: it.price, qty: it.qty })),
      summary: calcSummary(),
      payMethod: (fd.get('pay')||'bank').toLowerCase()
    };

    if(!GAS) throw new Error('未設定後端 API（GAS_ENDPOINT）');

    const r = await fetch(GAS, { method:'POST', body: JSON.stringify(payload) });
    const json = await r.json();

    if(!json.ok){
      throw new Error(json.msg || '下單失敗，請稍後再試');
    }

    const orderNo = json.order_no;
    if(payload.payMethod==='linepay' && json.linepay){
      // 手機先嘗試 appUrl，失敗再 webUrl
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      const urlApp = json.linepay.appUrl, urlWeb = json.linepay.webUrl;
      if(isMobile && urlApp){
        location.href = urlApp;
        // 備援：2秒後若還在此頁，改跳 web
        setTimeout(()=>{ if(document.visibilityState==='visible' && urlWeb) location.href = urlWeb; }, 2000);
      }else if(urlWeb){
        location.href = urlWeb;
      }
      // 不清空購物車，待 LINE Pay 回跳成功頁再由後端更新
    }else{
      // 匯款：成功就清空
      clearCart();
      alert('訂單已送出！訂單編號：' + orderNo);
    }

  }catch(err){
    alert(err.message||String(err));
  }finally{
    if(btn){ btn.disabled = !($('#agreeRules')?.checked && getCart().length>0); btn.textContent = '送出訂單'; }
    if(hint) hint.textContent = '';
  }
});

function calcSummary(){
  const cart = getCart();
  const subtotal = cart.reduce((s,i)=>s + i.price*i.qty, 0);
  const shipping = subtotal>=1800 ? 0 : (subtotal>0?150:0);
  const { discount } = getDiscount(subtotal);
  const total = Math.max(0, subtotal + shipping - discount);
  return { subtotal, shipping, discount, total };
}

function clearCart(){
  localStorage.removeItem(CART_KEY);
  renderCart();
}

/** 動態評論 100 則（每年採收期自動更新；3★僅 2 則） */
(function buildReviews(){
  const box = $('#reviewsList'); if(!box) return;
  const namesM = ['陳先生','林先生','王先生','吳先生','張先生','蔡先生','徐先生','許先生','李先生','周先生','黃先生','梁先生','柯先生','蕭先生','曾先生','鄭先生','邱先生','鍾先生','朱先生','洪先生'];
  const namesF = ['陳小姐','林小姐','王小姐','吳小姐','張小姐','蔡小姐','徐小姐','許小姐','李小姐','周小姐','黃小姐','梁小姐','柯小姐','蕭小姐','曾小姐','鄭小姐','邱小姐','鍾小姐','朱小姐','洪小姐'];
  const pool = namesM.concat(namesF);

  const now = new Date();
  const y = now.getFullYear();
  // 產季（10~3）：我們生成 100 筆在當季月份
  const months = [10,11,12,1,2,3];
  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randDate(){
    const m = rand(months);
    const d = Math.max(1, Math.min(28, Math.floor(Math.random()*28)+1));
    const year = (m<=3) ? y : y; // 本年顯示
    const mm = String(m).padStart(2,'0'); const dd = String(d).padStart(2,'0');
    return `${year}-${mm}-${dd}`;
  }
  const texts = [
    '沒吃過這麼好吃的椪柑','果香很乾淨','孩子超喜歡','冷藏更清爽','甜度穩定','幾乎沒在踩雷',
    '手剝超療癒','多汁不膩','回購第三年','送禮很有面子','汁水超多','顆顆完整',
    '拆箱有香氣','沒有藥味','油胞香氣很明顯','果肉細嫩','酸甜平衡','老欉真的穩',
    '批次穩定','物超所值','家人都說讚','清甜順口','甜但不膩','口感很細',
    '果皮好剝','冷藏超好吃','榨汁也好喝','小孩搶著吃','會再回購','包裝穩固',
    '物流很快','客服很貼心','產地直送新鮮','每瓣都漂亮','油胞亮','沒有乾癟果',
    '果香持久','甜中帶清香','當季好味道','家裡一天一顆','回購清單第一名',
    '理賠清楚','推薦朋友','價格合理','品質穩定','香氣迷人','肉質很細',
    '甜度夠','果汁飽滿','不苦不澀','柑香明顯','吃得到陽光','孩子愛吃不挑',
  ];

  const list = [];
  for(let i=0;i<100;i++){
    const name = rand(pool);
    let star = 5;
    if(i<2) star = 3; // 兩筆 3★
    else if(i%15===0) star = 4;

    const text = rand(texts);
    list.push({ name, date: randDate(), star, text });
  }

  // 轉為卡片
  list.forEach(r=>{
    const el = document.createElement('div');
    el.className = 'rv';
    el.innerHTML = `
      <div class="rv-h">
        <span class="rv-name">${r.name}</span>
        <span class="rv-date">${r.date}</span>
        <span class="rv-stars">${'🍊'.repeat(r.star)}</span>
      </div>
      <div class="rv-t">${r.text}</div>
    `;
    box.appendChild(el);
  });
})();

/** 啟用提交按鈕條件：同意須知 & 有商品 */
document.addEventListener('input', ()=>{
  $('#btnSubmit').disabled = !( $('#agreeRules')?.checked && getCart().length>0 );
});

/** 平滑滾動（導引按鈕） */
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const t = $(a.getAttribute('href'));
    if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

/** 設定甜/酸/香條狀圖長度（用 clip-path；避免改結構） */
const style = document.createElement('style');
style.textContent = `.bar::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#ff9d3d,#ff7a00);transform-origin:left;transform:scaleX(var(--val, .6));}`;
document.head.appendChild(style);
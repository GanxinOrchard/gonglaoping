/* ====== 可調變數 ====== */
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec";

/* ====== 工具 ====== */
const $ = (sel, el=document)=>el.querySelector(sel);
const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
const fmt = n => 'NT$ ' + (Number(n)||0).toLocaleString('en-US');
const byId = id => document.getElementById(id);
const ls = {
  get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{ return def } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
};

/* ====== 產季時間軸（雙列橫向） ====== */
function buildTimeline(){
  // 椪柑：10~12 青皮、12~4 橙皮
  const pon = [
    {m:10, t:'青皮椪柑', c:'#a5d66a'},
    {m:11, t:'椪柑高峰', c:'#f5a54b'},
    {m:12, t:'橙皮始', c:'#f08b2d'},
    {m:1,  t:'橙皮穩定', c:'#d26a10'},
    {m:2,  t:'橙皮甜香', c:'#d86f12'},
    {m:3,  t:'尾聲', c:'#f0b37b'},
    {m:4,  t:'儲藏柑', c:'#f3cda3'}
  ];
  // 茂谷：12~3
  const mur = [
    {m:12, t:'上市', c:'#ff9a3b'},
    {m:1,  t:'高峰', c:'#e47814'},
    {m:2,  t:'穩定', c:'#dd7718'},
    {m:3,  t:'尾聲', c:'#f0b37b'}
  ];
  renderMonths($('.month-scroller[data-kind="ponkan"]'), pon);
  renderMonths($('.month-scroller[data-kind="murcott"]'), mur);

  function renderMonths(root, arr){
    root.innerHTML = arr.map(x=>`
      <div class="month">
        <i class="orange-ico" style="--c:${x.c}"></i>
        <b>${x.m} 月</b>
        <em>${x.t}</em>
      </div>`).join('');
  }
}

/* ====== 故事輪播（箭頭不擋字） ====== */
function storyCarousel(){
  const box = $('.story-carousel');
  const slides = $$('.story-slide', box);
  let idx = 0;
  function show(i){
    idx = (i+slides.length) % slides.length;
    slides.forEach((s,k)=>{ s.style.display = (k===idx?'block':'none'); });
  }
  show(0);
  $('.story-arrow.next', box).onclick = ()=>show(idx+1);
  $('.story-arrow.prev', box).onclick = ()=>show(idx-1);
  const delay = Number(box.dataset.autoplay||6500);
  setInterval(()=>show(idx+1), delay);
}

/* ====== 規格 → 尺寸/量表 ====== */
const SPEC_SIZE_CM = { // 單顆直徑（約）
  "23A":"6.0–6.5 cm",
  "25A":"6.5–7.0 cm",
  "27A":"7.0–7.5 cm",
  "30A":"7.5–8.0 cm"
};
function specBinding(){
  $$('.product-card').forEach(card=>{
    const btns = $$('.spec-btn', card);
    const sizeNote = $('.size-note', card);
    btns.forEach(b=>{
      b.onclick = ()=>{
        btns.forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        const spec = b.dataset.spec;
        sizeNote.textContent = '單顆直徑約 ' + (SPEC_SIZE_CM[spec]||'-');
        // 可依規格微調價錢或剩餘
        const priceEl = $('.js-price', card);
        const leftEl  = $('.js-left', card);
        let base = Number(priceEl.textContent)||780;
        const adj = { "23A":-20, "25A":0, "27A":+40, "30A":+80 }[spec]||0;
        priceEl.textContent = (base+adj);
        leftEl.textContent  = Math.max(0, Number(leftEl.textContent)-1);
      };
    });
  });
}

/* ====== 購物車 ====== */
const cart = {
  list: ls.get('cart', []),
  add(item){ this.list.push(item); this.persist(); drawCart(); },
  remove(i){ this.list.splice(i,1); this.persist(); drawCart(); },
  clear(){ this.list = []; this.persist(); drawCart(); },
  persist(){ ls.set('cart', this.list); byId('cartCount').textContent = this.list.length; }
};
function bindAddToCart(){
  $$('.product-card .add-cart').forEach(btn=>{
    btn.onclick = ()=>{
      const card = btn.closest('.product-card');
      const sku  = card.dataset.sku;
      const title= $('.product-title', card).textContent.trim();
      const spec = $('.spec-btn.active', card).dataset.spec;
      const price= Number($('.js-price', card).textContent)||0;
      cart.add({ sku, title, spec, price, qty:1 });
      openCart();
    };
  });
}
function drawCart(){
  const root = byId('cartList');
  root.innerHTML = cart.list.map((it,i)=>`
    <div class="cart-item">
      <div><b>${it.title}</b>｜${it.spec}</div>
      <div class="cart-qty">
        <button class="btn btn-sm" data-i="${i}" data-op="-">－</button>
        <span>${it.qty}</span>
        <button class="btn btn-sm" data-i="${i}" data-op="+">＋</button>
        <b class="cart-sum">${fmt(it.price*it.qty)}</b>
        <button class="btn btn-sm" data-i="${i}" data-op="x">刪</button>
      </div>
    </div>`).join('') || `<div class="muted">購物車是空的</div>`;
  root.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      const i = Number(b.dataset.i); const op = b.dataset.op;
      if(op==="+") cart.list[i].qty++;
      if(op==="-") cart.list[i].qty=Math.max(1,cart.list[i].qty-1);
      if(op==="x") cart.remove(i);
      cart.persist(); drawCart(); calcTotal();
    };
  });
  calcTotal();
}
function calcTotal(){
  const subtotal = cart.list.reduce((s,it)=>s+it.price*it.qty,0);
  const shipping = subtotal>=2000?0:120;
  const total = subtotal + shipping;
  byId('subtotal').textContent = fmt(subtotal);
  byId('shipping').textContent = fmt(shipping);
  byId('grand').textContent = fmt(total);
  // 同意物流須知才可按
  byId('btnCheckout').disabled = !byId('agreeLogistics').checked || cart.list.length===0;
}

/* ====== 面板開關 & 浮動鈕 ====== */
const cartPanel = byId('cartPanel');
function openCart(){ cartPanel.classList.add('open'); }
function closeCart(){ cartPanel.classList.remove('open'); }
byId('cartFab').onclick = openCart;
byId('cartClose').onclick = closeCart;
byId('cartClear').onclick = ()=>{ if(confirm('清空購物車？')) cart.clear(); };
byId('cartGotoLookup').onclick = ()=>{ closeCart(); byId('lookupDialog').showModal(); };
byId('lookupFab').onclick = ()=> byId('lookupDialog').showModal();

/* ====== 訂單欄位記憶 ====== */
['name','phone','email','addr','remark'].forEach(id=>{
  const el = byId(id);
  el.value = ls.get('f_'+id,'');
  el.oninput = ()=> ls.set('f_'+id, el.value);
});

/* ====== 物流須知勾選 ====== */
byId('agreeLogistics').onchange = calcTotal;

/* ====== 結帳（LINE Pay 回跳 ＆ 防呆） ====== */
byId('checkoutForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!byId('agreeLogistics').checked){ alert('請先勾選「我已詳閱物流須知」'); return; }
  if(cart.list.length===0){ alert('購物車是空的'); return; }

  const pay = $('input[name="pay"]:checked').value;
  const ship= $('input[name="ship"]:checked').value;

  const payload = {
    name:byId('name').value.trim(),
    phone:byId('phone').value.trim(),
    email:byId('email').value.trim(),
    addr:byId('addr').value.trim(),
    remark:byId('remark').value.trim(),
    ship, payMethod: pay,
    items: cart.list,
    summary:{
      subtotal: cart.list.reduce((s,it)=>s+it.price*it.qty,0),
      shipping: (cart.list.reduce((s,it)=>s+it.price*it.qty,0) >= 2000 ? 0 : 120)
    }
  };
  payload.summary.total = payload.summary.subtotal + payload.summary.shipping;

  byId('btnCheckout').disabled = true;
  byId('payHint').textContent = (pay==='linepay' ? '前往 LINE Pay 中…' : '建立訂單中…');

  try{
    const res = await fetch(GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const json = await res.json();

    if(!json.ok){ throw new Error(json.msg || '下單失敗'); }

    // LINE Pay：若有付款網址，嘗試直接開啟 app；失敗回 web
    if(json.linepay && json.linepay.webUrl){
      tryOpenLinePay(json.linepay.appUrl, json.linepay.webUrl);
      // 不立即清空，待回頁面後再手動，避免付款失敗卻遺失
      alert('已為您建立訂單：'+ json.order_no + '\n若未自動開啟 LINE，請允許彈出視窗或改點線上付款網址。');
    }else{
      // 一般匯款：直接顯示成立
      alert('訂單建立成功：'+ json.order_no);
      cart.clear();
      closeCart();
    }
  }catch(err){
    alert('很抱歉，建立/付款發生問題：'+ err.message);
  }finally{
    byId('btnCheckout').disabled = false;
    byId('payHint').textContent = '';
  }
});
function tryOpenLinePay(appUrl, webUrl){
  let jumped = false;
  // 先嘗試 appUrl
  if(appUrl){
    try{
      window.location.href = appUrl;
      jumped = true;
      setTimeout(()=>{ if(!document.hidden && webUrl){ window.location.href = webUrl; } }, 1200);
    }catch{ jumped=false; }
  }
  if(!jumped && webUrl){ window.location.href = webUrl; }
}

/* ====== 訂單查詢（GAS doGet?orderNo=） ====== */
byId('doLookup').onclick = async (e)=>{
  e.preventDefault();
  const no = byId('lookupNo').value.trim();
  if(!no){ return; }
  byId('lookupResult').textContent = '查詢中…';
  try{
    const url = GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no);
    const r = await fetch(url); const j = await r.json();
    if(!j.ok){ byId('lookupResult').textContent = j.msg || '查無訂單'; return; }
    const lines = j.items.map(it=>`${it.title}｜${it.size}×${it.qty} = ${fmt(it.amount)}`).join('\n');
    byId('lookupResult').textContent =
`訂單：${j.orderNo}
狀態：${j.shipStatus || '-'}
總額：${fmt(j.total||0)}
收件：${j.address||'-'}
品項：
${lines}`;
  }catch(err){ byId('lookupResult').textContent = '查詢失敗：' + err.message; }
};

/* ====== 左側評語（50+ 筆、慢速輪播） ====== */
function buildReviews(){
  const names = ['怡君','志明','阿豪','庭瑄','小芸','Sirena','Jason','阿傑','阿芬','阿義','瑜珊','孟庭','大維','彥廷','于淳','Sharon','可欣','庭安','柏霖','子瑜','Mia','小米','阿凱','玟甄','Ivy','Joey','Eason','葳葳','小翰','Nina'];
  const words = ['超甜不膩','果香乾淨','小孩超愛','長輩說好吃','很穩定','爆汁','CP值高','皮很好剝','冰過更讚','每顆都漂亮','沒有雷','回購','送禮有面子','比去年更甜','酸甜剛好','汁多香濃'];
  const items = new Set();
  while(items.size<52){
    const n = names[Math.random()*names.length|0];
    const w1= words[Math.random()*words.length|0];
    const w2= words[Math.random()*words.length|0];
    const d = rndSeasonDate();
    items.add(`${d}｜${n}：${w1}、${w2}`);
  }
  function rndSeasonDate(){
    // 產季：10~4；茂谷：12~3；每年自動更新為當年度
    const y = new Date().getFullYear();
    const pick = [[y,10],[y,11],[y,12],[y+1,1],[y+1,2],[y+1,3],[y+1,4]][Math.random()*7|0];
    const dt = new Date(pick[0], pick[1]-1, 1+ (Math.random()*27|0));
    const mm = (dt.getMonth()+1).toString().padStart(2,'0');
    const dd = dt.getDate().toString().padStart(2,'0');
    return `${dt.getFullYear()}-${mm}-${dd}`;
  }
  const list = Array.from(items);
  const track = byId('reviewsTrack');
  track.innerHTML = list.map(s=>`<div class="rev">${s}</div>`).join('');
  // 緩慢自動滾動
  let pos = 0;
  setInterval(()=>{
    pos = (pos + 1) % (track.scrollHeight - track.clientHeight + 1);
    track.scrollTo({ top: pos, behavior:'smooth' });
  }, 1800);
}
byId('reviewsFab').onclick = ()=> byId('reviewsPanel').classList.add('open');
$('#reviewsPanel .panel-close').onclick = ()=> $('#reviewsPanel').classList.remove('open');

/* ====== 初始化 ====== */
buildTimeline();
storyCarousel();
specBinding();
bindAddToCart();
cart.persist(); drawCart();
buildReviews();

/* ====== 小互動：橘子導引點擊放大 ====== */
$$('.orange-pill').forEach(a=>{
  a.addEventListener('click', ()=>{ a.style.transform='scale(1.1)'; setTimeout(()=>a.style.transform='',160); });
});

/* ====== GAS 後端建議（避免 LINE Pay 失敗卻寄成立信）
在 doPost 裡，將「sendOrderCreatedMail_(...)」移到
if (LINEPAY.enabled && data.payMethod==='linepay'){ ... return linepay ... }
的後面，並加一個條件：
if (data.payMethod!=='linepay') { sendOrderCreatedMail_(...) }
*/
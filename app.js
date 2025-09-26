/* ====== 全域設定 ====== */
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec";

/* 折扣碼（可調）：到期日過後不可用 */
const COUPONS = {
  ORANGE200: { type:'fixed', amount:200, expires:'2026-12-31' },
  ORANGE10 : { type:'percent', amount:10,  expires:'2026-12-31' }
};

/* 尺寸直徑（cm） */
const DIAMETERS = { '23A':'6.0–6.5', '25A':'6.5–7.0', '27A':'7.0–7.5', '30A':'7.5–8.0' };

/* 量表設定（0–100） */
const METER = {
  ponkan: {
    '23A':{sweet:70,acid:35,aroma:60, price:760},
    '25A':{sweet:75,acid:40,aroma:65, price:780},
    '27A':{sweet:80,acid:45,aroma:70, price:820},
    '30A':{sweet:85,acid:50,aroma:75, price:880}
  },
  murcott: {
    '23A':{sweet:78,acid:38,aroma:72, price:800},
    '25A':{sweet:82,acid:40,aroma:76, price:820},
    '27A':{sweet:86,acid:44,aroma:80, price:860},
    '30A':{sweet:90,acid:48,aroma:84, price:920}
  }
};

/* 產品封面圖（箱子） */
const COVER_IMG = "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png";

/* 簡易狀態 */
const cart = JSON.parse(localStorage.getItem('gx_cart')||'[]');
const formMem = JSON.parse(localStorage.getItem('gx_mem')||'{}');
let appliedCoupon = null;

/* ====== Helper ====== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const fmt = n => 'NT$ ' + (Math.max(0,Math.round(n))).toLocaleString('en-US');

function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400); }
function saveCart(){ localStorage.setItem('gx_cart', JSON.stringify(cart)); $('#cart-count').textContent = cart.reduce((a,b)=>a+b.qty,0); }
function memSet(){ const m = {name:$('#name').value,email:$('#email').value,phone:$('#phone').value,addr:$('#addr').value,remark:$('#remark').value}; localStorage.setItem('gx_mem',JSON.stringify(m)); }

function setMeters(card, sku, size){
  const m = METER[sku][size];
  card.querySelectorAll('.bar').forEach(b=>{
    const key = b.dataset.key;
    b.style.setProperty('--v', m[key]);
  });
  card.querySelector('.num').textContent = m.price;
  card.querySelector('.dia-text').textContent = `約 ${DIAMETERS[size]} cm`;
}

/* ====== 產季時間軸內容（保持你的設計，改由 JS 填） ====== */
function renderSeason(){
  const grid = $('.season-grid');
  const items = [
    {mon:'10 月',note:'青皮椪柑上場',tone:'light'},
    {mon:'11 月',note:'椪柑高峰',tone:'light'},
    {mon:'12 月',note:'橙皮始｜茂谷起',tone:'mid'},
    {mon:'1 月', note:'橙皮穩定',tone:'deep'},
    {mon:'2 月', note:'橙皮甜香',tone:'mid'},
    {mon:'3 月', note:'橙皮尾聲（茂谷終）',tone:'light'},
    {mon:'4 月', note:'儲藏柑',tone:'light'}
  ];
  grid.innerHTML = items.map(it=>`
    <div class="m-card">
      <div class="m-orange"></div>
      <div>
        <div class="m-month">${it.mon}</div>
        <div class="m-note">${it.note}</div>
      </div>
    </div>
  `).join('');
}

/* ====== 商品卡互動（合併選購指南） ====== */
function bindProducts(){
  $$('.product-card').forEach(card=>{
    const sku = card.dataset.sku;
    card.querySelectorAll('.size').forEach(btn=>{
      btn.addEventListener('click',()=>{
        card.querySelectorAll('.size').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        setMeters(card, sku, btn.dataset.size);
      });
    });
    // 初始
    const first = card.querySelector('.size.active').dataset.size;
    setMeters(card, sku, first);

    // 加入購物車（不自動開啟）
    card.querySelector('.add').addEventListener('click',()=>{
      const size = card.querySelector('.size.active').dataset.size;
      const price = METER[sku][size].price;
      const item = {
        sku, size, price, qty:1,
        title: (sku==='ponkan'?'公老坪椪柑':'東勢茂谷'),
        img: COVER_IMG, weight:'10台斤'
      };
      // 合併相同項
      const hit = cart.find(x=>x.sku===item.sku && x.size===item.size);
      if(hit) hit.qty += 1; else cart.push(item);
      saveCart();
      toast('已加入購物車');
    });
  });
}

/* ====== 浮動面板控制 ====== */
function openPanel(id){ $(id).classList.add('open'); }
function closePanel(id){ $(id).classList.remove('open'); }

function bindPanels(){
  $('#btn-cart').onclick = ()=>openPanel('#cart-panel');
  $('#cart-close').onclick = ()=>closePanel('#cart-panel');
  $('#cart-clear').onclick = ()=>{ cart.length=0; saveCart(); renderCart(); };

  $('#btn-praise').onclick = ()=>openPanel('#praise-panel');
  $$('#praise-panel .panel-close').forEach(b=>b.onclick=()=>closePanel('#praise-panel'));

  $('#btn-lookup').onclick = ()=>openPanel('#lookup-panel');
  $$('#lookup-panel .panel-close').forEach(b=>b.onclick=()=>closePanel('#lookup-panel'));

  $('.to-top').onclick = ()=>scrollTo({top:0,behavior:'smooth'});
}

/* ====== 購物車 ====== */
function renderCart(){
  const wrap = $('#cart-items');
  if(!cart.length){ wrap.innerHTML = `<div class="muted">購物車是空的</div>`; calcSummary(); return; }
  wrap.innerHTML = cart.map((it,i)=>`
    <div class="item">
      <div>
        <div><b>${it.title}</b>｜${it.weight}｜${it.size}</div>
        <div class="muted">單顆直徑約 ${DIAMETERS[it.size]} cm</div>
      </div>
      <div>${fmt(it.price)}</div>
      <div class="qty">
        <button class="pill" data-ix="${i}" data-op="-">–</button>
        <b>${it.qty}</b>
        <button class="pill" data-ix="${i}" data-op="+">+</button>
      </div>
      <div>${fmt(it.price*it.qty)}</div>
    </div>
  `).join('');

  wrap.querySelectorAll('button[data-ix]').forEach(btn=>{
    btn.onclick = ()=>{
      const ix = +btn.dataset.ix, op = btn.dataset.op;
      if(op==='+') cart[ix].qty++;
      else cart[ix].qty = Math.max(0, cart[ix].qty-1);
      if(cart[ix].qty===0) cart.splice(ix,1);
      saveCart(); renderCart();
    };
  });

  calcSummary();
}

function getCouponDiscount(subtotal){
  if(!appliedCoupon) return 0;
  const rule = COUPONS[appliedCoupon];
  const today = new Date().toISOString().slice(0,10);
  if(!rule || today>rule.expires) return 0;
  if(rule.type==='fixed') return Math.min(subtotal, rule.amount);
  if(rule.type==='percent') return Math.round(subtotal * (rule.amount/100));
  return 0;
}
function calcSummary(){
  const sub = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discount = getCouponDiscount(sub);
  const after = Math.max(0, sub - discount);
  const ship = after >= 1800 || after===0 ? 0 : 160;
  const total = after + ship;

  $('#sum-sub').textContent = fmt(sub);
  $('#sum-discount').textContent = discount ? '– ' + fmt(discount).replace('NT$ ','NT$ ') : '– NT$ 0';
  $('#sum-ship').textContent = fmt(ship);
  $('#sum-total').textContent = fmt(total);
}

function bindCoupon(){
  $('#apply-coupon').onclick = ()=>{
    const code = ($('#coupon').value||'').trim().toUpperCase();
    if(!code){ $('#coupon-msg').textContent='請輸入折扣碼'; return; }
    const rule = COUPONS[code];
    const today = new Date().toISOString().slice(0,10);
    if(!rule) { $('#coupon-msg').textContent='折扣碼不存在'; appliedCoupon=null; calcSummary(); return; }
    if(today>rule.expires){ $('#coupon-msg').textContent='折扣碼已過期'; appliedCoupon=null; calcSummary(); return; }
    appliedCoupon = code; $('#coupon-msg').textContent='已套用：' + code; calcSummary();
  };
}

/* ====== 訂單送出（防呆 + LINE Pay 導轉） ====== */
function bindCheckout(){
  // 帶入記憶
  ['name','email','phone','addr','remark'].forEach(id=>{ if(formMem[id]) $('#'+id).value = formMem[id]; });
  $$('#order-form input, #order-form select').forEach(el=>el.addEventListener('change',memSet));

  $('#order-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!cart.length) { toast('購物車是空的'); return; }
    if(!$('#agree').checked){ toast('請閱讀並勾選物流須知'); return; }

    const btn = $('#btn-checkout');
    btn.disabled = true; $('#checkout-msg').textContent = '送出訂單中，請稍候…';

    const payload = {
      name:$('#name').value.trim(),
      email:$('#email').value.trim(),
      phone:$('#phone').value.trim(),
      addr:$('#addr').value.trim(),
      remark:$('#remark').value.trim(),
      ship:'宅配',
      items:cart.map(i=>({title:i.title,weight:i.weight,size:i.size,price:i.price,qty:i.qty})),
      summary:{
        subtotal: cart.reduce((s,i)=>s+i.price*i.qty,0),
        discount: getCouponDiscount(cart.reduce((s,i)=>s+i.price*i.qty,0)),
        shipping: 0, // 後端會再計算；這裡給 0 讓金額以伺服器為準
        total: 0
      },
      payMethod: $('#pay').value
    };

    try{
      const r = await fetch(GAS_ENDPOINT, {method:'POST', body:JSON.stringify(payload)});
      const json = await r.json();

      if(!json.ok){ throw new Error(json.msg||'下單失敗'); }

      // LINE Pay：優先導到 appUrl，失敗再用 webUrl
      if(json.linepay){
        const {appUrl, webUrl} = json.linepay;
        closePanel('#cart-panel');
        setTimeout(()=>{
          const isMobile = /iphone|android|ipad/i.test(navigator.userAgent);
          window.location.href = (isMobile && appUrl) ? appUrl : (webUrl || appUrl);
        }, 300);
        btn.disabled = false; $('#checkout-msg').textContent = '';
        return;
      }

      // 匯款：前端直接完成
      cart.length=0; saveCart(); renderCart();
      $('#checkout-msg').textContent = '';
      toast('下單成功！我們將盡速與您聯繫');
    }catch(err){
      $('#checkout-msg').textContent = '下單失敗：' + err.message;
      btn.disabled = false;
    }
  });
}

/* ====== 訂單查詢 ====== */
function bindLookup(){
  $('#lookup-form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const no = ($('#lookup-no').value||'').trim();
    if(!no) return;
    const url = GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no);
    try{
      const r = await fetch(url); const j = await r.json();
      $('#lookup-result').textContent = j.ok ? JSON.stringify(j, null, 2) : (j.msg||'查無此單');
    }catch(err){
      $('#lookup-result').textContent = '查詢失敗：' + err.message;
    }
  });
}

/* ====== 好評 100 則（自動年份／採收期） ====== */
function buildReviews(){
  const track = document.querySelector('.review-track');
  const year = new Date().getFullYear();
  const months = [10,11,12,1,2,3]; // 採收期
  const namesA = ['陳','林','張','黃','李','王','吳','劉','蔡','楊','許','鄭','謝','洪','郭','邱','曾','賴','周','蘇'];
  const namesB = ['先生','小姐','媽媽','爸爸','阿姨','哥','姐'];
  const notes = [
    '沒吃過這麼好吃的椪柑','酸甜剛好，果香很乾淨','孩子超愛，三天就吃完一箱','冷藏後更清爽不膩',
    '油胞香氣明顯','手剝不黏手','回購三年品質穩定','汁多但不水','長輩說這就是小時候的味道',
    '甜度很高但不膩','橙香迷人','果肉細嫩','送禮體面','打開就聞到香氣','每顆大小均勻',
    '理賠說明清楚','分級穩定','到貨很新鮮','現榨也好喝','孩子當點心剛剛好'
  ];
  const cards = [];
  let threeStarCount = 0;
  for(let i=0;i<100;i++){
    const m = months[Math.floor(Math.random()*months.length)];
    const y = (m>=10?year:year+1);
    const d = String(1 + Math.floor(Math.random()*27)).padStart(2,'0');
    const name = namesA[Math.floor(Math.random()*namesA.length)] + namesB[Math.floor(Math.random()*namesB.length)];
    const note = notes[(i+7)%notes.length] + (i%5===0?'，已分享給親友':'');
    let star = 5;
    if(threeStarCount<2 && i%37===0){ star=3; threeStarCount++; }
    else if(i%9===0){ star=4; }
    const stars = '★'.repeat(star) + '☆'.repeat(5-star);
    cards.push(`
      <div class="review-card">
        <div class="review-line"><b>${name}</b><span>${y}-${String(m).padStart(2,'0')}-${d}</span></div>
        <div class="stars">${stars}</div>
        <p>${note}</p>
      </div>
    `);
  }
  track.innerHTML = cards.join('');
}

/* ====== 輪播箭頭（通用） ====== */
function bindArrows(){
  document.addEventListener('click',e=>{
    const btn = e.target.closest('.arrow'); if(!btn) return;
    const target = btn.dataset.target;
    const track = target==='story' ? $('.story-track') :
                  target==='closeup' ? $('.closeup-track') :
                  target==='review' ? $('.review-track') : null;
    if(!track) return;
    const delta = btn.classList.contains('next') ? 420 : -420;
    track.scrollBy({left:delta,behavior:'smooth'});
  });
}

/* ====== init ====== */
function init(){
  saveCart(); // count
  renderSeason();
  bindProducts();
  bindPanels();
  renderCart();
  bindCoupon();
  bindCheckout();
  bindLookup();
  buildReviews();
  bindArrows();
}
document.addEventListener('DOMContentLoaded', init);
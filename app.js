/* =========================================================
 * 柑心果園｜app.js（完整覆蓋版）
 * ---------------------------------------------------------
 * - 全站互動：導覽捲動、果實近拍輪播、品牌故事輪播、產季時間軸
 * - 購物車：加入不自動開啟、LS記憶、折扣碼（$200 / 9折，含到期）、金額計算
 * - 訂單：送出顯示「送出訂單中，請稍候…」、表單記憶、訂單查詢
 * - LINE Pay：行動優先 appUrl，桌機 webUrl
 * - 評論：自動生成 100 則、每年產季日期自動更新、水平輪播
 * =======================================================*/

/* =============== 可調參數 / 素材 =============== */
const CONFIG = {
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  FREE_SHIP_THRESHOLD: 1800,
  SHIPPING_FEE: 160,
  BRAND: "柑心果園",
  // 亂碼折扣碼（可改日期）
  COUPONS: [
    { code: genCode("GX200"), type: "fixed",   amount: 200,  percent: 0, expires: "2026-12-31" },
    { code: genCode("GX90"),  type: "percent", amount: 0,    percent: 10, expires: "2026-12-31" }
  ],
  // 果實近拍輪播圖
  FRUIT_SHOTS: [
    "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg",
    "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D.jpg",
    "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"
  ],
  // 品牌故事輪播（可直接改字）
  STORIES: [
    {
      title: "把山當家，慢慢長大的甜",
      text: "我們在公老坪與東勢，順著節氣與樹勢而行。修枝、疏果、等待，是祖輩留下的節奏；該收就收、該捨就捨，是我們的膽識。"
    },
    {
      title: "一顆橘子，承載的是家族把山當家的方法。",
      text: "上架前都要經過「看色、捏彈、聞油胞」三道手感檢查。祖父說：手要比秤更準。舊派堅持，讓新派風味有了靈魂。"
    },
    {
      title: "我們把速度還給成熟；把分數交給味道。",
      text: "不追風口、只追成熟度。真正的高端，是你不需要挑，每一顆都能放心給家人吃。現在預購，享早鳥免運。"
    }
  ],
  // 產季（小型卡片輪播）
  SEASON: {
    "椪柑":  ["10","11","12","01","02","03","04"], // 青→橙到 4 月
    "茂谷":  ["12","01","02","03"]                  // 12–3 月
  },
  // 尺寸對應直徑（cm）—可依你品規微調
  SIZE_DIAMETER: {
    "23A": "約 7.0–7.4 cm",
    "25A": "約 7.5–7.9 cm",
    "27A": "約 8.0–8.4 cm",
    "30A": "約 8.5–8.9 cm"
  }
};

/* =============== 小工具 =============== */
function genCode(prefix){
  const r = Math.random().toString(36).slice(2,7).toUpperCase();
  return `${prefix}-${r}`;
}
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function currency(n){ return "NT$ " + (Number(n)||0).toLocaleString("en-US"); }
function todayStr(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}
function isExpired(dateStr){
  if(!dateStr) return false;
  return todayStr() > dateStr;
}
function isMobile(){
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/* =============== LocalStorage Keys =============== */
const LS = {
  cart:  "gx_cart",
  form:  "gx_form",
  ship:  "gx_ship",
  coupon:"gx_coupon",
  review:"gx_reviews_seed"
};

/* =============== 購物車狀態 =============== */
let CART = loadLS(LS.cart, []);
let APPLIED_COUPON = loadLS(LS.coupon, null);

function loadLS(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback)); }
  catch{ return fallback; }
}
function saveLS(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

/* =============== 折扣碼 =============== */
function validateCoupon(code){
  if(!code) return { ok:false, reason:"請輸入折扣碼" };
  const hit = CONFIG.COUPONS.find(c=>c.code.toUpperCase()===code.toUpperCase());
  if(!hit) return { ok:false, reason:"折扣碼不存在" };
  if(isExpired(hit.expires)) return { ok:false, reason:"折扣碼已過期" };
  return { ok:true, ...hit };
}
function applyCoupon(code){
  const v = validateCoupon(code);
  const msg = $('#couponMsg');
  if(!v.ok){
    APPLIED_COUPON = null; saveLS(LS.coupon, null);
    if(msg){ msg.textContent = v.reason; msg.style.color = "#dc2626"; }
  }else{
    APPLIED_COUPON = { code:v.code, type:v.type, amount:v.amount, percent:v.percent, expires:v.expires };
    saveLS(LS.coupon, APPLIED_COUPON);
    if(msg){
      msg.textContent = v.type==='fixed' ? `已套用：折抵 NT$${v.amount}`
                  : `已套用：${v.percent}% OFF`;
      msg.style.color = "#16a34a";
    }
  }
  renderCartTotals();
}
function clearCoupon(){
  APPLIED_COUPON = null; saveLS(LS.coupon, null);
  const msg = $('#couponMsg'); if(msg){ msg.textContent = "未使用折扣碼"; msg.style.color = "#6b7280"; }
  renderCartTotals();
}

/* =============== 金額計算 =============== */
function calcTotals(){
  const subtotal = CART.reduce((s,i)=> s + i.price*i.qty, 0);
  const shipping = subtotal >= CONFIG.FREE_SHIP_THRESHOLD || subtotal===0 ? 0 : CONFIG.SHIPPING_FEE;

  let discount = 0;
  if(APPLIED_COUPON && !isExpired(APPLIED_COUPON.expires)){
    if(APPLIED_COUPON.type==='fixed')   discount = Math.min(APPLIED_COUPON.amount, subtotal);
    if(APPLIED_COUPON.type==='percent') discount = Math.floor(subtotal * (APPLIED_COUPON.percent/100));
  }else{
    // 過期自動清除
    if(APPLIED_COUPON){ APPLIED_COUPON = null; saveLS(LS.coupon, null); }
  }

  const total = Math.max(0, subtotal - discount) + shipping;
  return { subtotal, discount, shipping, total };
}

/* =============== 購物車渲染/操作 =============== */
function renderCartList(){
  const wrap = $('#cartList');
  if(!wrap) return;
  if(CART.length===0){
    wrap.innerHTML = `<div class="muted">購物車是空的 🍊</div>`;
    return;
  }
  wrap.innerHTML = CART.map((c,i)=>`
    <div class="cart-row" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px dashed #eee">
      <div style="min-width:0">
        <div style="font-weight:700">${c.title}</div>
        <div class="note">${c.weight || ""}　${c.size || ""}　${currency(c.price)} × ${c.qty}</div>
      </div>
      <div class="qty">
        <button aria-label="減少" onclick="mutateQty(${i},-1)">–</button>
        <span>${c.qty}</span>
        <button aria-label="增加" onclick="mutateQty(${i},1)">＋</button>
      </div>
    </div>
  `).join('');
}
function renderCartTotals(){
  const t = calcTotals();
  if($('#subtotal')) $('#subtotal').textContent = currency(t.subtotal);
  if($('#discount')) $('#discount').textContent = '- ' + currency(t.discount);
  if($('#shipping')) $('#shipping').textContent = currency(t.shipping);
  if($('#total'))    $('#total').textContent    = currency(t.total);
  if($('#fabCount')) $('#fabCount').textContent = CART.reduce((n,i)=>n+i.qty,0);
}
function renderCart(){
  renderCartList();
  renderCartTotals();
}
function toggleCart(open){
  const drawer = $('#cartDrawer');
  if(!drawer) return;
  drawer.classList.toggle('open', !!open);
}
function clearCart(){
  if(!CART.length) return;
  if(confirm('確定清空購物車？')){
    CART.length = 0; saveLS(LS.cart, CART);
    renderCart();
  }
}
function mutateQty(idx, delta){
  const it = CART[idx];
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0) CART.splice(idx,1);
  saveLS(LS.cart, CART);
  renderCart();
}
function addToCartFromBtn(btn){
  // 支援 data-* 或 data-add='{"id":...}'
  const ds = btn.dataset;
  let payload;
  if(ds.add){
    try{ payload = JSON.parse(ds.add); }catch{ payload = {}; }
  }else{
    payload = {
      id: ds.id || (ds.title + '|' + (ds.size || '')),
      title: ds.title || '商品',
      price: Number(ds.price)||0,
      weight: ds.weight || '',
      size: ds.size || '',
      section: ds.section || ''
    };
  }
  if(!payload.id) payload.id = payload.title + '|' + payload.size;
  const hit = CART.find(x=>x.id===payload.id);
  if(hit){ hit.qty++; } else { CART.push({ ...payload, qty:1 }); }
  saveLS(LS.cart, CART);
  renderCart();
  toast('已加入購物車（右側可查看）');
}

/* =============== 表單（記憶與送出） =============== */
function restoreForm(){
  const obj = loadLS(LS.form, null);
  if(!obj) return;
  Object.entries(obj).forEach(([k,v])=>{
    const el = document.querySelector(`[name="${k}"]`);
    if(el) el.value = v;
  });
}
function bindFormMemory(){
  const form = $('#orderForm');
  if(!form) return;
  form.addEventListener('input', ()=>{
    const data = {};
    $all('input[name],textarea[name],select[name]', form).forEach(el=>{
      data[el.name] = el.value;
    });
    saveLS(LS.form, data);
  });
}
async function submitOrder(ev){
  ev.preventDefault();
  if(CART.length === 0){ toast('購物車是空的'); return; }

  const form = ev.target;
  const btn  = $('#submitBtn');
  const out  = $('#result');

  // 防呆提示
  if(btn){ btn.disabled = true; btn.textContent = '送出訂單中，請稍候…'; }
  if(out){ out.textContent = ''; }

  // 整理資料
  const f = new FormData(form);
  const payMethod = f.get('pay') || 'bank';
  const payload = {
    name: f.get('name')||'',
    phone:f.get('phone')||'',
    email:f.get('email')||'',
    addr: f.get('addr')||'',
    ship: '宅配',
    remark: f.get('remark')||'',
    items: CART.map(i=>({ title:i.title, weight:i.weight, size:i.size, price:i.price, qty:i.qty })),
    summary: calcTotals(),
    brand: CONFIG.BRAND
  };

  // 折扣碼寫入（讓後端有資訊可用）
  if(APPLIED_COUPON){
    payload.coupon = APPLIED_COUPON;
  }

  try{
    // LINE Pay：請後端預約付款（※ 目前你的 GAS 會在此就寄出「成立信」，若要阻止需改 GAS 的寄信時機）
    if(payMethod === 'linepay'){
      payload.payMethod = 'linepay';
      const r = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if(!d.ok) throw new Error(d.msg || '建立 LINE Pay 訂單失敗');

      const url = isMobile() ? (d.linepay?.appUrl || d.linepay?.webUrl) : d.linepay?.webUrl;
      if(!url) throw new Error('LINE Pay 回傳缺少付款連結');

      // 開新視窗避免返回卡住
      window.location.href = url;
      return; // 交給 LINE 完成→回到 GAS callback 頁（你的 doGet 已處理）
    }

    // 一般匯款：直接建單
    const r = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d = await r.json();
    if(!d.ok) throw new Error(d.msg || '建立訂單失敗');

    // 成功：清空購物車與表單
    CART.length = 0; saveLS(LS.cart, CART);
    clearCoupon();
    form.reset(); saveLS(LS.form, {});
    renderCart();
    if(out) out.innerHTML = `✅ 訂單已建立（編號：<b>${d.order_no}</b>），我們將盡速安排出貨。`;

  }catch(err){
    if(out) out.textContent = '送出失敗：' + (err.message || String(err));
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = '送出訂單'; }
  }
}

/* =============== 訂單查詢（浮動） =============== */
async function lookupOrder(){
  const no = prompt('請輸入訂單編號');
  if(!no) return;
  try{
    const url = `${CONFIG.GAS_ENDPOINT}?orderNo=${encodeURIComponent(no)}`;
    const r = await fetch(url);
    const d = await r.json();
    if(!d.ok) throw new Error(d.msg || '查無此訂單');
    const lines = (d.items||[]).map(i=>`${i.title} ${i.size||''} × ${i.qty}`).join('\n');
    alert(`訂單：${d.orderNo}\n狀態：${d.shipStatus||d.status||''}\n金額：${currency(d.total||0)}\n\n明細：\n${lines||'—'}`);
  }catch(e){
    alert('查詢失敗：' + (e.message||String(e)));
  }
}

/* =============== 果實近拍輪播（水平） =============== */
function initFruitShots(){
  const box = $('#fruitCarousel');
  if(!box) return;
  box.innerHTML = CONFIG.FRUIT_SHOTS.map((src,i)=>`
    <div class="shot"><img src="${src}" alt="果實近拍 ${i+1}" loading="lazy"></div>
  `).join('');
  // 簡易自動橫向位移
  let i = 0;
  setInterval(()=>{
    i = (i+1) % CONFIG.FRUIT_SHOTS.length;
    box.scrollTo({ left: box.clientWidth*i, behavior:'smooth' });
  }, 4000);
}

/* =============== 產季時間軸（橫向小卡） =============== */
function initSeason(){
  const box = $('#seasonCarousel');
  if(!box) return;
  // 以兩行（椪柑、茂谷）生成小卡
  const rows = Object.entries(CONFIG.SEASON).map(([name, months])=>{
    const items = months.map(m=>{
      const mm = m.padStart(2,'0');
      const isGreen = (name==='椪柑' && (mm==='10' || mm==='11')); // 10–11 青
      const tone = isGreen ? '#65a30d' : '#f97316';
      const txt  = isGreen ? '青皮風味清爽' : '香甜成熟期';
      return `
        <div class="mcard" style="border:1px solid #ffd7a1;background:#fff7ed">
          <div class="dot" style="background:${tone}"></div>
          <div class="m">${mm} 月</div>
          <div class="hint">${txt}</div>
        </div>`;
    }).join('');
    return `
      <div class="row">
        <div class="rtitle">${name}</div>
        <div class="strip">${items}</div>
      </div>`;
  }).join('');
  box.innerHTML = rows;
}

/* =============== 品牌故事輪播（文字） =============== */
function initStories(){
  const box = $('#storyCarousel');
  if(!box) return;
  box.innerHTML = CONFIG.STORIES.map((s,idx)=>`
    <div class="story" aria-hidden="${idx===0?'false':'true'}">
      <h3>${s.title}</h3>
      <p>${s.text}</p>
    </div>
  `).join('');
  let i=0;
  const stories = $all('.story', box);
  setInterval(()=>{
    stories[i].setAttribute('aria-hidden','true');
    i = (i+1) % stories.length;
    stories[i].setAttribute('aria-hidden','false');
  }, 5000);
  // 左右箭頭（若頁面有）
  $('#storyPrev')?.addEventListener('click', ()=>{
    stories[i].setAttribute('aria-hidden','true');
    i = (i-1+stories.length)%stories.length;
    stories[i].setAttribute('aria-hidden','false');
  });
  $('#storyNext')?.addEventListener('click', ()=>{
    stories[i].setAttribute('aria-hidden','true');
    i = (i+1)%stories.length;
    stories[i].setAttribute('aria-hidden','false');
  });
}

/* =============== 選購尺吋聯動（23A/25A/27A/30A → 直徑） =============== */
function initSizeHints(){
  $all('[data-size-select]').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      const size = sel.value;
      const hint = sel.closest('.product')?.querySelector('.size-diameter');
      if(hint) hint.textContent = CONFIG.SIZE_DIAMETER[size] || '';
    });
    // 初始
    const size = sel.value;
    const hint = sel.closest('.product')?.querySelector('.size-diameter');
    if(hint) hint.textContent = CONFIG.SIZE_DIAMETER[size] || '';
  });
}

/* =============== 買過都說讚（100則自動生成＋慢速輪播） =============== */
function randomReviews(year){
  const surnames = ["陳","林","黃","張","李","王","吳","劉","蔡","楊","許","鄭","謝","洪","郭","邱","曾","蕭","羅","潘","簡","朱","鍾","梁","高","何","鄧","葉"];
  const titles = [
    "沒吃過這麼好吃的椪柑","果汁多到爆","小孩超愛","甜香不膩口","每年必回購","長輩指定要這家","比想像中還讚",
    "剝皮就香","果肉很細嫩","真的產地直送","客服超耐心","冷藏更好吃","朋友收禮很開心","無雷的一箱",
    "補貨速度快","肉質細緻","香氣很乾淨","酸甜剛好","孩子每天都要","值得等待的成熟度","不追風口只追風味",
    "祖傳的手感選果太強","已經介紹同事買","寄到就甜","汁水漂亮","家人稱讚","口感很穩定","果皮好剝",
    "大小平均","油胞香很明顯","好剝好分瓣","送禮有面子","箱內保護做得好","理賠說明清楚","真的不用挑",
    "太療癒了","口感軟硬剛好","沾鹽更甜","冰過像甜點","放兩天更香","清爽不膩","孩子牙口也OK",
    "比市面好太多","值得等待","價格實在","會再回購","甜而不膩","很新鮮","口感層次多","已經第二箱"
  ];
  const reviews = [];
  const months = [10,11,12,1,2,3,4]; // 產季內
  let threeStarCount = 0;
  for(let i=0;i<100;i++){
    const s = surnames[Math.floor(Math.random()*surnames.length)];
    const gender = Math.random()>.5?'先生':'小姐';
    const title = titles[Math.floor(Math.random()*titles.length)];
    const m = months[Math.floor(Math.random()*months.length)];
    const dd = String(1 + Math.floor(Math.random()*28)).padStart(2,'0');
    const mm = String(m).padStart(2,'0');
    const yyyy = (m>=10 ? year : year+1); // 10–12 屬本年、1–4 屬隔年
    let star = (Math.random()>.5?5:4);
    if(threeStarCount<2 && Math.random()<0.05){ star=3; threeStarCount++; }
    reviews.push({
      name: `${s}${gender}`,
      date: `${yyyy}-${mm}-${dd}`,
      star,
      text: title
    });
  }
  return reviews;
}
function initReviews(){
  const box = $('#reviewsSlider');
  if(!box) return;
  // 以年份種子避免每次刷新都完全不同
  const nowY = new Date().getFullYear();
  let seed = loadLS(LS.review, null);
  if(!seed || seed.year!==nowY){
    seed = { year: nowY, data: randomReviews(nowY) };
    saveLS(LS.review, seed);
  }
  box.innerHTML = seed.data.map(r=>{
    const stars = '👍'.repeat(Math.max(1, r.star-2)); // 不用星星，改讚數量（3~5）
    return `
      <div class="rv">
        <div class="rv-top">
          <span class="rv-name">${r.name}</span>
          <span class="rv-date">${r.date}</span>
        </div>
        <div class="rv-body">${r.text}</div>
        <div class="rv-stars"><button class="pill">買過都說讚</button> ${stars}</div>
      </div>
    `;
  }).join('');
  // 慢速水平輪播
  let i = 0;
  setInterval(()=>{
    i = (i+1) % seed.data.length;
    box.scrollTo({ left: i*260, behavior: 'smooth' }); // 260 = 卡片寬估算（請配合 CSS）
  }, 3000);
}

/* =============== 子導覽捲動（單行橘子按鈕） =============== */
function bindSubnav(){
  $all('[data-go]').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const id = a.getAttribute('data-go');
      const el = document.getElementById(id);
      if(!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior:'smooth' });
    });
  });
}

/* =============== 小吐司 =============== */
function toast(msg){
  let t = $('#toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;right:16px;bottom:80px;background:#111;color:#fff;padding:10px 14px;border-radius:12px;opacity:0;transition:.25s;z-index:1300';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(window.__tt);
  window.__tt = setTimeout(()=>{ t.style.opacity = '0'; }, 1600);
}

/* =============== 初始綁定 =============== */
function initDelegates(){
  // 所有「加入購物車」按鈕
  $all('[data-add],[data-id][data-title][data-price]').forEach(btn=>{
    btn.addEventListener('click', ()=> addToCartFromBtn(btn));
  });
  // 漢堡/右側浮動
  $('#cartFab')?.addEventListener('click', ()=> toggleCart(true));
  $('#closeCartBtn')?.addEventListener('click', ()=> toggleCart(false));
  $('#clearCartBtn')?.addEventListener('click', clearCart);
  $('#lookupFab')?.addEventListener('click', lookupOrder);

  // 折扣碼
  $('#applyCouponBtn')?.addEventListener('click', ()=>{
    const c = ($('#couponInput')?.value || '').trim();
    applyCoupon(c);
  });
  $('#clearCouponBtn')?.addEventListener('click', clearCoupon);

  // 訂單表單
  $('#orderForm')?.addEventListener('submit', submitOrder);
}

/* =============== 啟動 =============== */
document.addEventListener('DOMContentLoaded', ()=>{
  // UI 元件
  initStories();
  initFruitShots();
  initSeason();
  initSizeHints();
  initReviews();
  bindSubnav();
  initDelegates();

  // 表單記憶
  restoreForm();
  bindFormMemory();

  // 初始購物車
  renderCart();
});

/* =============== 對外（若頁面仍有 inline onclick 亦可用） =============== */
window.toggleCart   = toggleCart;
window.clearCart    = clearCart;
window.mutateQty    = mutateQty;
window.renderCart   = renderCart;
window.lookupOrder  = lookupOrder;
window.applyCoupon  = applyCoupon;
window.clearCoupon  = clearCoupon;
window.submitOrder  = submitOrder;
window.addToCartFromBtn = addToCartFromBtn;

=== Cart Scroll Lock + Mobile Fullscreen behavior (drop-in fix) === */
(function(){
  let scrollY = 0;
  function lockBody(){
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${scrollY}px`;
  }
  function unlockBody(){
    document.body.classList.remove('modal-open');
    const y = scrollY; document.body.style.top = '';
    window.scrollTo(0, y);
  }

  function isVisible(el){
    if(!el) return false;
    const cls = el.classList;
    return (cls.contains('show') || cls.contains('open') || el.style.display === 'flex' || el.style.display === 'block');
  }

  function watch(panel){
    const apply = ()=>{
      if (isVisible(panel)) lockBody(); else unlockBody();
    };
    // 初始套用一次
    apply();
    // 觀察 class/style 變化
    const mo = new MutationObserver(apply);
    mo.observe(panel, { attributes:true, attributeFilter:['class','style'] });

    // 若你是用按鈕切換，也一併綁定（可選）
    document.querySelectorAll('[data-cart-open]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ setTimeout(apply, 0); });
    });
    document.querySelectorAll('[data-cart-close], #btnCloseCart').forEach(btn=>{
      btn.addEventListener('click', ()=>{ setTimeout(apply, 0); });
    });
  }

  function init(){
    const panel = document.querySelector('.panel.cart') || document.getElementById('cartDrawer');
    if (panel) watch(panel);

    // 補：加入購物車後只跳提示，不自動開面板（若你有舊 addToCart，我們尊重但蓋掉 auto-open）
    if (typeof window.addToCart === 'function'){
      const old = window.addToCart;
      window.addToCart = function(){
        try{ old.apply(this, arguments); }catch(e){}
        // 若舊版會開面板，嘗試馬上關閉並保持提示
        const p = document.querySelector('.panel.cart') || document.getElementById('cartDrawer');
        if (p && isVisible(p)) { setTimeout(()=>{ p.classList.remove('show','open'); p.style.display=''; }, 0); }
      };
    }

    // 行動裝置 LINE Pay：優先 appUrl，失敗回退 webUrl（避免卡在空白頁）
    window.goLinePay = async function(orderNo, payload){
      try{
        const info = payload && payload.linepay ? payload.linepay : null;
        if(!info || (!info.appUrl && !info.webUrl)) throw new Error('找不到付款網址');
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android|line\//.test(ua);

        if (isMobile && info.appUrl){
          const t0 = Date.now(); location.href = info.appUrl;
          setTimeout(()=>{ if(Date.now()-t0<1400 && info.webUrl){ location.href = info.webUrl; } }, 1200);
        }else{
          location.href = info.webUrl || info.appUrl;
        }
      }catch(err){
        alert('LINE Pay 開啟失敗：' + err.message);
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
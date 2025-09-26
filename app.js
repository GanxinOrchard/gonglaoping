/* =========================
   柑心果園 app.js
   互動 / 購物車 / 導覽 / LINE Pay / 輪播 / 量表
   ========================= */

const CONFIG = {
  BRAND: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  CURRENCY: "TWD",
  IMAGES: {
    HERO: raw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    GENERIC10: raw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    PONGAN_FRUIT: raw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    MAOGAO_FRUIT: raw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"),
    VIDEO1: raw("https://github.com/s9000721-cloud/gonglaoping/blob/main/780323577.063367.mp4"),
  },
  PRICES: {
    PONGAN: { "10台斤": { "23A": 750, "25A": 780, "27A": 820, "30A": 880 } },
    MAOGAO: { "10台斤": { "23A": 720, "25A": 760, "27A": 800, "30A": 860 } }
  },
  INVENTORY: {
    "PON10-23A":{sold:50, stock:200}, "PON10-25A":{sold:122, stock:678}, "PON10-27A":{sold:66, stock:734}, "PON10-30A":{sold:55, stock:745},
    "MAO10-23A":{sold:72, stock:178}, "MAO10-25A":{sold:355, stock:545}, "MAO10-27A":{sold:102, stock:698}, "MAO10-30A":{sold:78, stock:722}
  },
  STATUS: {
    "PON10-23A":"preorder","PON10-25A":"preorder","PON10-27A":"preorder","PON10-30A":"preorder",
    "MAO10-23A":"preorder","MAO10-25A":"preorder","MAO10-27A":"preorder","MAO10-30A":"preorder"
  },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
};

const VARIETIES = {
  PONGAN: {
    title: "椪柑",
    section: "PONGAN",
    weight: "10台斤",
    sizes: ["23A","25A","27A","30A"],
    id: s => `PON10-${s}`,
    baseScale: { sweet: 4.0, acid: 2.0, aroma: 3.0 },
    mouthfeel: ["脆","多汁","清爽"],
    people: ["長輩","送禮"],
    preview: () => CONFIG.IMAGES.PONGAN_FRUIT
  },
  MAOGAO: {
    title: "茂谷",
    section: "MAOGAO",
    weight: "10台斤",
    sizes: ["23A","25A","27A","30A"],
    id: s => `MAO10-${s}`,
    baseScale: { sweet: 4.5, acid: 2.5, aroma: 4.0 },
    mouthfeel: ["細嫩","爆汁","香甜"],
    people: ["孩子","怕澀者"],
    preview: () => CONFIG.IMAGES.MAOGAO_FRUIT
  }
};

// 參考：A 值（圓周公分）對應常見直徑範圍（推算）——批次/產地略有差異
const SIZE_DIAMETER_CM = {
  "23A": "直徑約 6–7.5 cm",
  "25A": "直徑約 7–8 cm",
  "27A": "直徑約 7.5–8.5 cm",
  "30A": "直徑約 8.5–9.5 cm",
};

const LS = { CART:"gx_cart", FORM:"gx_form" };

/* ===== utils ===== */
function raw(u){return !u?u:(u.includes('raw.githubusercontent.com')?u:u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/'))}
const currency = n => "NT$ " + (n||0).toLocaleString();
function $(sel, root=document){return root.querySelector(sel)}
function $all(sel, root=document){return Array.from(root.querySelectorAll(sel))}
function goScroll(e){
  e.preventDefault();
  const id = e.currentTarget.getAttribute('href').replace('#','');
  const el = document.getElementById(id);
  const y = el.getBoundingClientRect().top + window.scrollY - 68;
  window.scrollTo({top:y,behavior:'smooth'});
}

/* ===== nav actions ===== */
$all('[data-scroll]').forEach(a=>a.addEventListener('click', goScroll));
$('#btnQuery')?.addEventListener('click', ()=>toggleQuery(true));
$('#btnAdmin')?.addEventListener('click', ()=>toggleAdmin(true));
$('#btnCart')?.addEventListener('click', ()=>toggleCart(true));

/* ===== Hero image ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  // hero 背景已在 inline style 設 var(--hero)
  // 產品卡圖統一用 10斤產品圖
  $('#img-pongan').src = CONFIG.IMAGES.GENERIC10;
  $('#img-maogao').src = CONFIG.IMAGES.GENERIC10;

  // Guide 預覽填入水果近拍
  $('#g-preview').src = VARIETIES.PONGAN.preview();

  // Gallery 預設
  $('#gal1').src = VARIETIES.PONGAN.preview();
  $('#gal2').src = VARIETIES.MAOGAO.preview();
  const v = $('#gal3');
  v.src = CONFIG.IMAGES.VIDEO1; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
  $('#gal4').src = CONFIG.IMAGES.GENERIC10;

  initSpecUI();
  initGuideUI();
  renderCart();
  initPolicy();
  initReviewsRail();
  initCarousels();
  initFlipbook();
  $('#freeShipText').textContent = currency(CONFIG.FREE_SHIP_THRESHOLD).replace('NT$ ','NT$ ');
});

/* ===== spec chips, price, scale ===== */
const SELECTED = { PONGAN:"25A", MAOGAO:"25A" };

function initSpecUI(){
  Object.keys(VARIETIES).forEach(kind=>{
    const conf = VARIETIES[kind];
    const rail = $(`#spec-${kind.toLowerCase()}`);
    rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'on':''}" data-kind="${kind}" data-size="${s}">${conf.weight}｜${s}</button>`).join('');
    rail.addEventListener('click', e=>{
      const btn = e.target.closest('.spec'); if(!btn) return;
      SELECTED[kind] = btn.dataset.size;
      updateVarietyCard(kind);
    });
    updateVarietyCard(kind);
  });
}

function updateVarietyCard(kind){
  const conf = VARIETIES[kind];
  const size = SELECTED[kind];
  // 打開樣式
  $all(`#spec-${kind.toLowerCase()} .spec`).forEach(b=>b.classList.toggle('on', b.dataset.size===size));
  // 價格
  const price = CONFIG.PRICES[conf.section][conf.weight][size] || 0;
  $(`#price-${kind.toLowerCase()}`).textContent = currency(price);
  // 庫存
  const pid = conf.id(size);
  const inv = CONFIG.INVENTORY[pid] || {sold:0,stock:0};
  $(`#inv-${kind.toLowerCase()}`).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock} 箱`;
  // 尺寸
  $(`#sizecm-${kind.toLowerCase()}`).textContent = SIZE_DIAMETER_CM[size] || '';
  // 甘心量表
  renderScale(`#scale-${kind.toLowerCase()}`, adjScale(conf.baseScale, size));
  // 同步到 Guide 預覽（若目前預覽的是此品種）
  if($('.guide-tabs .tab.on')?.dataset.preview===kind){ setGuideState(kind, size); }
}

function adjScale(base, size){
  // 大果普遍成熟度較高，甜 +0.2；小果酸度略高，酸 +0.2（僅視覺參考）
  const s = {...base};
  if(size==="30A"){ s.sweet = Math.min(5, s.sweet + 0.2); s.acid = Math.max(1, s.acid - 0.1); }
  if(size==="23A"){ s.acid = Math.min(5, s.acid + 0.2); }
  return s;
}

function renderScale(rootSel, scale){
  const root = $(rootSel);
  root.innerHTML = ["甜度","酸度","香氣"].map((k,i)=>{
    const val = [scale.sweet, scale.acid, scale.aroma][i];
    const dots = Array.from({length:5}).map((_,j)=>`<span class="dot ${j<Math.round(val)?'on':''}"></span>`).join('');
    const txt = k==="甜度" ? (val>=4.5?"濃甜":val>=4?"清甜":"微甜")
              : k==="酸度" ? (val<=2?"柔和":val<=3?"清新":"偏酸")
              : (val>=4?"香濃":val>=3?"清香":"淡雅");
    return `<div class="srow"><span>${k}</span><div class="dots">${dots}</div><span class="val">${txt}</span></div>`;
  }).join('');
}

/* ===== Guide (interactive) ===== */
function initGuideUI(){
  // tabs
  const tabs = $all('.guide-tabs .tab');
  tabs.forEach(b=>b.addEventListener('click', ()=>{
    tabs.forEach(t=>t.classList.remove('on'));
    b.classList.add('on');
    const kind = b.dataset.preview;
    setGuideState(kind, SELECTED[kind]);
  }));
  // default = PONGAN
  tabs[0].classList.add('on');
  setGuideState('PONGAN', SELECTED['PONGAN']);

  // quick size chips
  $all('.quick-sizes .chip').forEach(c=>{
    c.addEventListener('click', ()=>{
      const size = c.dataset.size;
      const kind = $('.guide-tabs .tab.on').dataset.preview;
      SELECTED[kind] = size;
      updateVarietyCard(kind);  // 也會刷新 guide
    });
  });
}

function setGuideState(kind,size){
  const conf = VARIETIES[kind];
  $('#g-preview').src = conf.preview();
  fillDots('#g-sweet', adjScale(conf.baseScale, size).sweet);
  fillDots('#g-acid', adjScale(conf.baseScale, size).acid);
  fillDots('#g-aroma', adjScale(conf.baseScale, size).aroma);
  $('#g-sweet-txt').textContent = textFor("甜度", adjScale(conf.baseScale, size).sweet);
  $('#g-acid-txt').textContent  = textFor("酸度", adjScale(conf.baseScale, size).acid);
  $('#g-aroma-txt').textContent = textFor("香氣", adjScale(conf.baseScale, size).aroma);
  // mouthfeel + people
  $('#g-mouthfeel').innerHTML = conf.mouthfeel.map(t=>`<span class="chip">${t}</span>`).join('');
  $('#g-people').innerHTML = conf.people.map(t=>`<span class="chip">${t}</span>`).join('');
  // size
  $('#g-sizecm').textContent = SIZE_DIAMETER_CM[size] || '—';
}
function fillDots(sel,val){
  $(sel).innerHTML = Array.from({length:5}).map((_,i)=>`<span class="dot ${i<Math.round(val)?'on':''}"></span>`).join('');
}
function textFor(k,val){
  return k==="甜度" ? (val>=4.5?"濃甜":val>=4?"清甜":"微甜")
       : k==="酸度" ? (val<=2?"柔和":val<=3?"清新":"偏酸")
       : (val>=4?"香濃":val>=3?"清香":"淡雅");
}

/* ===== Carousels ===== */
function initCarousels(){
  makeCarousel('#tipsTrack');
  makeCarousel('#galTrack');
}
function makeCarousel(trackSel){
  const root = document.querySelector(trackSel);
  const wrap = root.parentElement;
  const prev = wrap.querySelector('.prev');
  const next = wrap.querySelector('.next');
  const step = () => root.firstElementChild.getBoundingClientRect().width + 12;
  prev?.addEventListener('click',()=> root.scrollBy({left:-step(),behavior:'smooth'}));
  next?.addEventListener('click',()=> root.scrollBy({left: step(),behavior:'smooth'}));
}

/* ===== Flipbook (scroll-snap 已提供翻頁感) ===== */
function initFlipbook(){ /* 無需額外 JS */ }

/* ===== Reviews rail ===== */
function initReviewsRail(){
  const namesLast = "陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given = ["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","容","翔","修","均","凱"];
  const c5 = ["清甜多汁","香氣乾淨","回購第三次","皮薄好剝","冰過更好吃","送禮很體面","甜度穩定","孩子超愛"];
  const track = $('#rvTicker');
  const rows = [];
  for(let i=0;i<24;i++){
    const n = mask(randPick(namesLast)+randPick(given)+randPick(given));
    const t = randPick(c5);
    rows.push(`<div class="rail-item"><div>🍊</div><div><b>${n}</b>：${t}<div class="rail-stars">★★★★★</div></div></div>`);
  }
  track.innerHTML = rows.join('') + rows.join('');
  // 平滑滾動
  let pos = 0; const single = track.scrollHeight/2;
  function tick(){
    pos += 0.35; // 速度微調（比原版慢，且側邊較小）
    if(pos >= single) pos = 0;
    track.style.transform = `translateY(${-pos}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function mask(s){ return s.length<=2 ? s[0]+"○" : s[0]+"○".repeat(s.length-2)+s[s.length-1] }
function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

/* ===== Cart ===== */
const cart = loadCart();
function loadCart(){ try{const s=localStorage.getItem(LS.CART); return s?JSON.parse(s):[]}catch{return []} }
function saveCart(){ localStorage.setItem(LS.CART, JSON.stringify(cart)); }
function refreshCartCount(){ $('#cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0); }

function addSelected(kind){
  const conf = VARIETIES[kind];
  const size = SELECTED[kind];
  const pid = conf.id(size);
  const price = CONFIG.PRICES[conf.section][conf.weight][size];
  const title = `${conf.title}｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size,conf.section);
}
function addToCart(id,title,price,weight,size,section){
  if(CONFIG.STATUS[id]==='soldout'){ toast('此品項已售完'); return; }
  const ex = cart.find(i=>i.id===id);
  if(ex) ex.qty++;
  else cart.push({id,title,price,qty:1,weight,size,section});
  saveCart(); renderCart(); bumpCart(); toast('已加入購物車');
}
function bumpCart(){ const el=$('#btnCart'); el.style.transform='scale(1.05)'; setTimeout(()=>el.style.transform='',180); }
function mutateQty(i,d){ cart[i].qty += d; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ $('#cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ $('#queryDrawer').classList.toggle('open', !!open); }
function toggleAdmin(open){ $('#adminDrawer').classList.toggle('open', !!open); }

function renderCart(){
  refreshCartCount();
  const list = $('#cartList');
  if(!cart.length){
    list.innerHTML = `<div class="note">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>`;
  }else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="item">
        <div>
          <div><b>${c.title}</b></div>
          <div class="note">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div class="qty">
          <button aria-label="減少" onclick="mutateQty(${i},-1)">–</button>
          <span>${c.qty}</span>
          <button aria-label="增加" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>
    `).join('');
  }
  const {subtotal,shipping,total} = calc();
  $('#subtotal').textContent = currency(subtotal);
  $('#shipping').textContent = currency(shipping);
  $('#total').textContent = currency(total);
}
function calc(){
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping = (subtotal>=CONFIG.FREE_SHIP_THRESHOLD || cart.length===0) ? 0 : CONFIG.SHIPPING;
  return {subtotal,shipping,total:subtotal+shipping};
}

/* ===== Order & Payment ===== */
$('#orderForm')?.addEventListener('submit', submitOrder);
$('#orderForm')?.addEventListener('input', saveForm);

function saveForm(){
  const f = new FormData($('#orderForm'));
  const obj = Object.fromEntries(f);
  localStorage.setItem(LS.FORM, JSON.stringify(obj));
}
function loadForm(){
  try{
    const s = localStorage.getItem(LS.FORM);
    if(!s) return;
    const obj = JSON.parse(s);
    const f = $('#orderForm');
    for(const k in obj){ if(f[k]) f[k].value = obj[k]; }
  }catch{}
}

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length) return alert('購物車是空的');
  if(!$('#agree').checked) return alert('請先閱讀「物流與退貨說明」並勾選同意');

  const f = new FormData(ev.target);
  const payload = {
    ts: new Date().toISOString(),
    name: f.get('name'), phone: f.get('phone'), email: f.get('email'),
    addr: f.get('addr'), ship: '宅配',
    remark: f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND
  };

  const pay = f.get('pay') || 'LINEPAY';
  const btn = $('#submitBtn'); const res = $('#result');
  btn.disabled = true; btn.textContent = '處理中…'; res.textContent='';

  try{
    // 建立訂單
    const r1 = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d1 = await r1.json();
    if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
    const orderNo = d1.order_no;

    if(pay==='LINEPAY'){
      await goLinePay(orderNo, payload.summary.total, payload.items);
      return;
    }else{
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>
        請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。
        <div class="card" style="padding:10px; margin-top:8px">
          <div><b>${CONFIG.BANK.name}</b></div>
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>
        </div>`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
    }
  }catch(e){
    res.textContent = '送出失敗：' + e.message;
  }finally{
    btn.disabled = false; btn.textContent = '送出訂單';
  }
}

async function goLinePay(orderNo, amount, items){
  // 交由 GAS 寫入 ChannelId/Secret 與 confirm 流程
  const body = { orderNo, amount, currency: CONFIG.CURRENCY, items };
  const r = await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_request', { method:'POST', body: JSON.stringify(body) });
  const d = await r.json();
  if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
  localStorage.setItem('gx_lp_orderNo', orderNo);
  localStorage.setItem('gx_lp_amount', String(amount));
  location.href = d.paymentUrl;
}

(function handleLinePayReturn(){
  const q = new URLSearchParams(location.search);
  if(q.get('lp')==='return'){
    const orderNo = localStorage.getItem('gx_lp_orderNo');
    const amount = Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId = q.get('transactionId');
    if(orderNo && transactionId){
      (async()=>{
        try{
          const body = { orderNo, transactionId, amount, currency: CONFIG.CURRENCY };
          const r = await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_confirm', { method:'POST', body: JSON.stringify(body) });
          const d = await r.json();
          if(d.ok){ toast('付款成功，感謝支持！'); cart.length=0; saveCart(); renderCart(); localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount'); }
          else alert('付款確認失敗：' + (d.msg||''));
        }catch(e){ alert('付款確認錯誤：'+e.message); }
      })();
    }
  }
})();

/* ===== Query order ===== */
$('#queryForm')?.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const f = new FormData(ev.target);
  const no = (f.get('orderNo')||'').trim();
  const card = $('#queryCard'); const btn = $('#printBtn');
  card.style.display='block'; card.textContent='查詢中…'; btn.style.display='none';
  try{
    const r = await fetch(CONFIG.GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no));
    const data = await r.json();
    if(data.ok){
      const dateOnly = v => {
        if(!v) return '—';
        const d = new Date(v);
        return isNaN(d) ? String(v).split(/[ T]/)[0] : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      };
      const items = Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h3 style="margin:0">訂單查詢結果</h3>
          <div class="note">${new Date().toLocaleString()}</div>
        </div>
        <div class="line"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${data.status||'—'}</div>
        <div><b>出貨日期：</b>${data.shipDate?dateOnly(data.shipDate):'—'}</div>
        <div><b>物流單號：</b>${data.trackingNo||'—'}</div>
        <div><b>金額：</b>${data.total?currency(data.total):'—'}</div>
        <div><b>品項：</b>${items}</div>`;
      btn.style.display='inline-flex';
    }else{
      card.textContent = '查無此訂單編號';
    }
  }catch(e){
    card.textContent = '查詢失敗：' + e.message;
  }
});

/* ===== Policy enable (must scroll to bottom) ===== */
function initPolicy(){
  const det = $('#policy'); const agree = $('#agree');
  const enableIfBottom = ()=>{
    const sc = det.scrollTop + det.clientHeight;
    const need = det.scrollHeight - 10;
    if(sc >= need) agree.disabled = false;
  };
  det.addEventListener('scroll', enableIfBottom, {passive:true});
  // 若使用者點「我已閱讀」但還沒開啟
  $('.agree input')?.addEventListener('click', (e)=>{ if(agree.disabled){ e.preventDefault(); det.open = true; det.scrollIntoView({behavior:'smooth',block:'center'}); }});
  loadForm();
}

/* ===== Toast ===== */
let __toastTimer=null;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(__toastTimer); __toastTimer = setTimeout(()=>t.classList.remove('show'), 1800);
}

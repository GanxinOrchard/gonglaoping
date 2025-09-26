/*****************
 * 設定與資料區  *
 *****************/
const CONFIG = {
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    LOGO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png"),
    PRODUCT10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    GALLERY: [
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"),
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg") // <- 第三張改成你提供
    ]
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
  // 尺寸（直徑，參考區間）
  DIAMETER_CM: { "23A":"約 8.5–9.0 cm", "25A":"約 8.1–8.5 cm", "27A":"約 7.6–8.0 cm", "30A":"約 7.1–7.5 cm" },
  STORIES: [
    {
      quote:"一顆橘子，承載的是家族把山當家的方法。",
      text:"我們的椪柑在公老坪傳承了好幾代；東勢的茂谷，也走過半世紀的風土學。修枝、疏果、等待，是祖輩留下的節奏；該收就收、該捨就捨，是我們的膽識。每一顆上架前，都要經過「看色、捏彈、聞油胞」三道手感檢查，因為祖父只教一句：手要比秤更準。這種舊派堅持，讓新派風味有了靈魂。"
    },
    {
      quote:"我們把速度，還給成熟；把分數，交給味道。",
      text:"不追風口，只追成熟度。少一分躁、少一分多餘的投入；順著節氣，順著樹勢。我們相信：真正的高端，不是華麗辭藻，而是你不需要挑、每一顆都能放心給家人吃。當你說「今年這批特別好」，那就是我們與土地的對稿通過了。"
    }
  ]
};

// 商品定義
const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`MAO10-${s}` }
};
const SELECTED = { PONGAN:"25A", MAOGAO:"25A" };

const LS = { cart:'gx_cart', form:'gx_form' };

/*****************
 * 初始化與渲染   *
 *****************/
document.addEventListener('DOMContentLoaded', () => {
  // Hero 圖
  document.querySelector('#hero').style.backgroundImage = `url('${toRaw(CONFIG.IMAGES.HERO)}')`;
  // Logo
  document.querySelector('#brandLogo').src = CONFIG.IMAGES.LOGO;
  document.querySelector('#footerLogo').src = CONFIG.IMAGES.LOGO;
  document.querySelector('#freeShipText').textContent = "NT$ " + CONFIG.FREE_SHIP_THRESHOLD.toLocaleString();

  // 故事輪播
  renderStories();

  // KPI 滑入
  observeReveal();

  // Gallery
  renderGallery();

  // 產品
  document.querySelector('#img-pongan').src = CONFIG.IMAGES.PRODUCT10;
  document.querySelector('#img-maogao').src = CONFIG.IMAGES.PRODUCT10;
  renderSpecChips('PONGAN'); renderSpecChips('MAOGAO');

  // 指南
  renderGuide();

  // 產季時間軸
  renderTimeline();

  // 流程
  renderFlow();

  // 保存/切法
  renderSchool();

  // 購物車
  attachCartEvents();
  renderCart();

  // 訂單查詢
  attachQueryEvents();

  // 導覽
  attachNav();
});

/*****************
 * 小工具         *
 *****************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ " + (n||0).toLocaleString();
const priceOf = (section,weight,size) => CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;

/*****************
 * 故事輪播       *
 *****************/
function renderStories(){
  const box = document.getElementById('storySlider');
  box.innerHTML = CONFIG.STORIES.map(s=>`
    <article class="story-slide card">
      <p class="story-quote">「${s.quote}」</p>
      <p class="story-text">${s.text}</p>
    </article>
  `).join('');
}

/*****************
 * KPI 滑入       *
 *****************/
function observeReveal(){
  const obs = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('seen'); });
  },{threshold:.15});
  document.querySelectorAll('[data-reveal]').forEach(el=>obs.observe(el));
}

/*****************
 * Gallery 1:1    *
 *****************/
function renderGallery(){
  const rail = document.getElementById('galleryRail');
  rail.innerHTML = CONFIG.IMAGES.GALLERY.map(src=>`
    <figure class="card"><img src="${src}" alt="果實近拍"></figure>
  `).join('');
}

/*****************
 * 產品規格籤     *
 *****************/
function renderSpecChips(kind){
  const conf = PRODUCTS[kind];
  const rail = document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`
    <button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">
      ${conf.weight}｜${s}
    </button>
  `).join('');
  // 價格／庫存／尺寸
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).innerHTML =
    `${currency(price)}　<span class="muted">（直徑 ${CONFIG.DIAMETER_CM[SELECTED[kind]]}）</span>`;
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid] || {sold:0, stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent =
    `已售出 ${inv.sold}　剩餘 ${inv.stock} 箱`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); }
function addSelected(kind){
  const conf=PRODUCTS[kind], size=SELECTED[kind], pid=conf.getId(size);
  const price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size,conf.section);
}

/*****************
 * 選購指南       *
 *****************/
function renderGuide(){
  const box = document.getElementById('guideBox');
  box.innerHTML = `
    <div class="card">
      <b>甜度 / 酸度 / 香氣（甘心量表）</b>
      <div class="muted">椪柑：甜 4｜酸 2｜香 3　｜　茂谷：甜 4.5｜酸 2.5｜香 4</div>
    </div>
    <div class="card">
      <b>口感關鍵詞</b>
      <div class="muted">椪柑：脆、多汁、清爽｜茂谷：細嫩、爆汁、香甜</div>
    </div>
    <div class="card">
      <b>尺寸參考（直徑）</b>
      <div class="muted">23A：${CONFIG.DIAMETER_CM["23A"]}；25A：${CONFIG.DIAMETER_CM["25A"]}；27A：${CONFIG.DIAMETER_CM["27A"]}；30A：${CONFIG.DIAMETER_CM["30A"]}</div>
    </div>
  `;
}

/*****************
 * 產季時間軸     *
 *****************/
function renderTimeline(){
  const months = [
    {m:'10 月', t:'青皮椪柑'},
    {m:'11 月', t:'椪柑高峰'},
    {m:'12 月', t:'橙皮始｜茂谷'},
    {m:'1 月',  t:'橙皮穩定'},
    {m:'2 月',  t:'橙皮甜香'},
    {m:'3 月',  t:'橙皮尾聲'},
    {m:'4 月',  t:'儲藏柑'}
  ];
  const box = document.getElementById('timelineBox');
  box.innerHTML = months.map(x=>`
    <div class="month"><b>${x.m}</b><div class="muted">${x.t}</div></div>
  `).join('');
}

/*****************
 * 購買流程       *
 *****************/
function renderFlow(){
  const steps = [
    {k:'預購',  text:'選規格加入購物車，填好資料，選 LINE Pay / 匯款 / 自取現金。'},
    {k:'分級',  text:'現採分級裝箱，手工檢視每一顆。'},
    {k:'通知',  text:'簡訊 / Email 通知出貨與追蹤碼。'},
    {k:'開箱',  text:'到貨全程錄影，有問題 24 小時內回報。'}
  ];
  const wrap = document.getElementById('flowSteps');
  wrap.innerHTML = steps.map((s,i)=>`<button class="step" onclick="showFlow(${i})">${i+1}</button>`).join('');
  window.__flowData = steps;
}
function showFlow(i){
  const d = window.__flowData[i];
  const card = document.getElementById('flowCard');
  card.style.display='block';
  card.innerHTML = `<h3 style="margin:0 0 6px">${i+1}. ${d.k}</h3><p class="muted">${d.text}</p>`;
}

/*****************
 * 保存/切法      *
 *****************/
function renderSchool(){
  const box = document.getElementById('schoolBox');
  box.innerHTML = `
    <article class="card"><b>保存</b><ul><li>冷藏：到貨後盡量冷藏，風味穩定。</li><li>通風陰涼：常溫存放請避日照悶熱。</li></ul></article>
    <article class="card"><b>切法</b><ul><li>茂谷：沿果蒂放射 4 刀 → 6 塊。</li><li>小香橘：整顆輕按再剝。</li><li>椪柑：直接手剝，冰過更清爽。</li></ul></article>
  `;
}

/*****************
 * 購物車         *
 *****************/
const cart = (()=>{ try{ return JSON.parse(localStorage.getItem(LS.cart)||'[]'); }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function attachCartEvents(){
  document.getElementById('cartFab').onclick = ()=>toggleCart(true);
  document.getElementById('btnCloseCart').onclick = ()=>toggleCart(false);
  document.getElementById('btnClear').onclick = clearCart;
  document.getElementById('backTop').onclick = ()=>window.scrollTo({top:0,behavior:'smooth'});

  // 條款滑到底才能勾
  const det = document.getElementById('policy');
  const agree = document.getElementById('agree');
  det.addEventListener('scroll', ()=>{
    const sc = det.scrollTop + det.clientHeight;
    if(sc >= det.scrollHeight-10) agree.disabled = false;
  });

  document.getElementById('orderForm').addEventListener('submit', submitOrder);
}
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }
function addToCart(pid,title,price,weight,size,section){
  const existed = cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({ id:pid, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); toast('已加入購物車');
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function calc(){
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping = (subtotal>=CONFIG.FREE_SHIP_THRESHOLD || cart.length===0) ? 0 : CONFIG.SHIPPING;
  return {subtotal,shipping,total:subtotal+shipping};
}
function renderCart(){
  document.getElementById('fabCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  const list = document.getElementById('cartList');
  if(!cart.length){ list.innerHTML = `<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>`; }
  else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="cart-row">
        <div><b>${c.title}</b><div class="muted">${currency(c.price)} × ${c.qty}</div></div>
        <div class="qty">
          <button onclick="mutateQty(${i},-1)">–</button>
          <span>${c.qty}</span>
          <button onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>
    `).join('');
  }
  const {subtotal,shipping,total} = calc();
  document.getElementById('subtotal').textContent = currency(subtotal);
  document.getElementById('shipping').textContent = currency(shipping);
  document.getElementById('total').textContent = currency(total);
}

/*****************
 * 下單/付款/查詢 *
 *****************/
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length) return alert('購物車是空的');

  const agree = document.getElementById('agree');
  if(!agree.checked) return alert('請先閱讀條款並勾選同意');

  const f = new FormData(ev.target);
  const payMethod = (f.get('pay') || 'LINEPAY');
  const payload = {
    ts: new Date().toISOString(),
    name: f.get('name'), phone: f.get('phone'), email: f.get('email'),
    addr: (f.get('ship')||'').startsWith('自取') ? '自取（台中市石岡區石岡街61號）' : (f.get('addr')||''),
    ship: f.get('ship') || '宅配',
    remark: f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(),
    brand: CONFIG.BRAND_TAG
  };

  const btn = document.getElementById('submitBtn');
  const res = document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; res.textContent='';

  try{
    // 建立訂單
    const r = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d = await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');
    const orderNo = d.order_no;

    if(payMethod==='LINEPAY'){
      await goLinePay(orderNo, payload);
      return;
    }else if(payMethod==='BANK'){
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於 24 小時內匯款並回報後五碼。\
        <div class="card" style="padding:10px;margin-top:8px">
          <div><b>${CONFIG.BANK.name}</b></div>
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>
        </div>`;
    }else{ // 自取現金
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於備註聯繫自取時間，門市：台中市石岡區石岡街61號（現金）。`;
    }

    cart.length=0; saveCart(); renderCart(); ev.target.reset();
  }catch(e){
    res.textContent = '送出失敗：' + e.message;
  }finally{
    btn.disabled=false; btn.textContent='送出訂單';
  }
}

async function goLinePay(orderNo, payload){
  const amount = payload.summary.total;
  const body = { orderNo, amount, currency:CONFIG.PAY.currency, items:payload.items };
  const r = await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_request', { method:'POST', body: JSON.stringify(body) });
  const d = await r.json();
  if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
  localStorage.setItem('gx_lp_orderNo', orderNo);
  localStorage.setItem('gx_lp_amount', String(amount));
  location.href = d.paymentUrl; // 導轉至 LINE Pay
}

// 回跳確認
(async function handleLinePayReturn(){
  const p = new URLSearchParams(location.search);
  if(p.get('lp')==='return'){
    const orderNo = localStorage.getItem('gx_lp_orderNo');
    const amount = Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId = p.get('transactionId');
    if(orderNo && transactionId){
      try{
        const body={ orderNo, transactionId, amount, currency:CONFIG.PAY.currency };
        const r=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_confirm', { method:'POST', body: JSON.stringify(body) });
        const d=await r.json();
        if(d.ok){ toast('付款成功，感謝支持！'); cart.length=0; saveCart(); renderCart();
          localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount'); }
        else alert('付款確認失敗：'+(d.msg||''));
      }catch(e){ alert('付款確認錯誤：'+e.message); }
    }
  }
})();

/*****************
 * 訂單查詢       *
 *****************/
function attachQueryEvents(){
  const openQ = ()=>toggleQuery(true), closeQ=()=>toggleQuery(false);
  document.getElementById('btnQuery').onclick = openQ;
  document.getElementById('btnQueryM').onclick = openQ;
  document.getElementById('btnQueryF').onclick = openQ;
  document.getElementById('btnCloseQuery').onclick = closeQ;
  document.getElementById('printBtn').onclick = ()=>window.print();

  document.getElementById('queryForm').addEventListener('submit', async ev=>{
    ev.preventDefault();
    const no = new FormData(ev.target).get('orderNo');
    const card = document.getElementById('queryCard');
    const r = await fetch(CONFIG.GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no));
    const d = await r.json();
    card.style.display='block';
    if(d.ok){
      const dateOnly = v => { try{const x=new Date(v); if(!isNaN(x)) return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;}catch(e){} return v||'—'; };
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h3 style="margin:0">訂單查詢結果</h3>
          <div class="muted">${new Date().toLocaleString()}</div>
        </div>
        <div class="line"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${d.status||'—'}</div>
        <div><b>出貨日期：</b>${dateOnly(d.shipDate)||'—'}</div>
        <div><b>物流單號：</b>${d.trackingNo||'—'}</div>
        <div><b>金額：</b>${d.total? 'NT$ '+(d.total||0).toLocaleString():'—'}</div>
        <div><b>品項：</b>${Array.isArray(d.items)? d.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—'}</div>
      `;
      document.getElementById('printBtn').style.display='inline-flex';
    }else{
      card.textContent = '查無此訂單編號';
    }
  });
}
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }

/*****************
 * 導覽（手機漢堡）*
 *****************/
function attachNav(){
  const hb = document.getElementById('hamburger');
  const mm = document.getElementById('mobileMenu');
  hb.addEventListener('click', ()=> mm.classList.toggle('show'));
  document.getElementById('btnTopF').onclick = ()=>window.scrollTo({top:0,behavior:'smooth'});
}

/*****************
 * Toast          *
 *****************/
let __tt=null;
function toast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(__tt); __tt=setTimeout(()=>t.classList.remove('show'), 1800);
}

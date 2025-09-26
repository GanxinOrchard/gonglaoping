/* ===== 基礎設定 ===== */
const CONFIG = {
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    GALLERIES: [
      {src: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"), cap:"椪柑｜切瓣近拍"},
      {src: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"), cap:"茂谷｜果色橙亮"},
      {src: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"), cap:"裝箱實拍"}
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
  // 尺寸（參考範圍，單位：cm）
  SIZES: { "23A":"約 8.5–9.2 cm", "25A":"約 8.0–8.5 cm", "27A":"約 7.5–8.0 cm", "30A":"約 7.0–7.5 cm" },
  // 指南用的甘心量表（1–5）
  GUIDE: {
    PONGAN: { sweet:{'23A':4,'25A':4,'27A':4,'30A':4}, sour:{'23A':2,'25A':2,'27A':2,'30A':2}, aroma:{'23A':3,'25A':3,'27A':3,'30A':3} },
    MAOGAO: { sweet:{'23A':5,'25A':5,'27A':4,'30A':4}, sour:{'23A':2,'25A':2,'27A':3,'30A':3}, aroma:{'23A':4,'25A':4,'27A':4,'30A':4} }
  },
  REVIEWS: [
    "好甜多汁，家人超愛！", "果香乾淨，剝皮就香～", "顆顆飽滿，已回購", "冰過更好吃", "價格實在，品質很棒"
  ],
  STORIES: [
    {title:"從山坡到紙箱", body:"我們在日夜溫差大的山坡地管理老欉，堅持手工採收、現採分級，當日整裝、隔日出貨。"},
    {title:"甜度不是運氣", body:"每批上架前都做『甘心量表』抽檢，甜度/酸度/香氣清楚可追溯，穩定不踩雷。"},
    {title:"把理賠講清楚", body:"收到當天 24 小時內附開箱錄影，有運損我們就依比例補寄或退差額，怎麼做就怎麼賠。"}
  ]
};

/* ===== 小工具 ===== */
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
function go(e,id){ if(e) e.preventDefault(); const el=document.getElementById(id); if(!el) return; const y=el.getBoundingClientRect().top+window.scrollY-60; window.scrollTo({top:y,behavior:'smooth'}); }

/* ===== 導覽 & 滾動動效 ===== */
function toggleHamburger(){ document.documentElement.classList.toggle('nav-open'); }
(function revealOnScroll(){
  const els=[...document.querySelectorAll('.reveal-up,.reveal-l,.reveal-r')];
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } }),{threshold:.15});
  els.forEach(el=>io.observe(el));
})();
(function heroParallax(){
  const hero=document.querySelector('.hero'); if(!hero?.dataset.parallax) return;
  window.addEventListener('scroll',()=>{ const y=Math.min(60, window.scrollY/12); hero.style.setProperty('--y', y+'px'); },{passive:true});
})();

/* ===== 故事：橘瓣翻頁 ===== */
const storyRail = document.getElementById('storyRail');
const orangeWipe = document.getElementById('orangeWipe');
let storyIndex = 0;
function renderStories(){
  storyRail.innerHTML = CONFIG.STORIES.map(s=>`
    <article class="story-card-item">
      <h3>${s.title}</h3>
      <p class="muted">${s.body}</p>
    </article>
  `).join('');
}
function triggerWipe(){
  orangeWipe.classList.remove('on'); void orangeWipe.offsetWidth; orangeWipe.classList.add('on');
}
function storyPrev(){ storyRail.scrollBy({left:-storyRail.clientWidth,behavior:'smooth'}); triggerWipe(); }
function storyNext(){ storyRail.scrollBy({left: storyRail.clientWidth,behavior:'smooth'}); triggerWipe(); }

/* ===== 果實近拍：1:1 輪播 ===== */
const gRail=document.getElementById('galleryRail');
const gDots=document.getElementById('galleryDots');
function renderGallery(){
  gRail.innerHTML = CONFIG.IMAGES.GALLERIES.map(g=>`
    <div class="gallery-card">
      <div class="gallery-media"><img alt="${g.cap}" src="${g.src}"></div>
      <div class="gallery-caption">${g.cap}</div>
    </div>`).join('');
  gDots.innerHTML = CONFIG.IMAGES.GALLERIES.map((_,i)=>`<div class="slider-dot ${i===0?'on':''}"></div>`).join('');
  gRail.addEventListener('scroll', ()=>{
    const i = Math.round(gRail.scrollLeft / gRail.clientWidth);
    gDots.querySelectorAll('.slider-dot').forEach((d,idx)=>d.classList.toggle('on', idx===i));
  }, {passive:true});
}

/* ===== 商品卡設定 ===== */
const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` }
};
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };
function priceOf(section,weight,size){ return CONFIG.PRICES[section]?.[weight]?.[size] ?? 0; }
function renderSpecChips(kind){
  const conf=PRODUCTS[kind]; const rail=document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}・剩餘 ${inv.stock}`;
  document.getElementById('size-'+kind.toLowerCase()).textContent = `參考尺寸：${CONFIG.SIZES[SELECTED[kind]]||'—'}`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); updateGuide(kind, size); }
function addSelected(kind){
  const conf=PRODUCTS[kind]; const size=SELECTED[kind];
  const pid=conf.getId(size); const price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size, conf.section);
}

/* ===== 選購指南：互動量表與尺寸 ===== */
function dots(n){ let s=""; for(let i=0;i<5;i++) s+=`<span class="dot ${i<n?'on':''}"></span>`; return s; }
function renderGuide(){
  const g=document.getElementById('guideBox');
  g.innerHTML = ['PONGAN','MAOGAO'].map(kind=>{
    const name = kind==='PONGAN'?'椪柑':'茂谷';
    const sizeTabs = PRODUCTS[kind].sizes.map(s=>`<button class="tab ${SELECTED[kind]===s?'on':''}" onclick="selectSpec('${kind}','${s}')">${s}</button>`).join('');
    return `
    <div class="guide-card" id="guide-${kind}">
      <div class="guide-top">
        <div><strong>${name}</strong></div>
        <div class="tabs">${sizeTabs}</div>
      </div>
      <div class="scale-row">
        <span class="label-chip">甜度</span> <span class="dots" id="g-${kind}-sweet">${dots(CONFIG.GUIDE[kind].sweet[SELECTED[kind]])}</span>
        <span class="label-chip">酸度</span> <span class="dots" id="g-${kind}-sour">${dots(CONFIG.GUIDE[kind].sour[SELECTED[kind]])}</span>
        <span class="label-chip">香氣</span> <span class="dots" id="g-${kind}-aroma">${dots(CONFIG.GUIDE[kind].aroma[SELECTED[kind]])}</span>
        <span class="label-chip">尺寸</span> <span class="size-note" id="g-${kind}-size">${CONFIG.SIZES[SELECTED[kind]]}</span>
      </div>
    </div>`;
  }).join('');
}
function updateGuide(kind,size){
  const g=CONFIG.GUIDE[kind];
  document.getElementById(`g-${kind}-sweet`).innerHTML = dots(g.sweet[size]);
  document.getElementById(`g-${kind}-sour`).innerHTML  = dots(g.sour[size]);
  document.getElementById(`g-${kind}-aroma`).innerHTML = dots(g.aroma[size]);
  document.getElementById(`g-${kind}-size`).textContent = CONFIG.SIZES[size];
}

/* ===== 產季時間軸 ===== */
function renderTimeline(){
  const months=[
    {m:"10 月",t:"青皮椪柑"},
    {m:"11 月",t:"椪柑高峰"},
    {m:"12 月",t:"橙皮始｜茂谷"},
    {m:"1 月",t:"橙皮穩定"},
    {m:"2 月",t:"橙皮甜香"},
    {m:"3 月",t:"橙皮尾聲"},
    {m:"4 月",t:"儲藏柑"}
  ];
  document.getElementById('timelineBox').innerHTML = months.map(x=>`<div class="month"><b>${x.m}</b><div class="muted">${x.t}</div></div>`).join('');
}

/* ===== 保存食用小教室 ===== */
function renderSchool(){
  const data=[
    {title:"保存", list:["到貨盡量冷藏，風味更穩定。","常溫請避開日照與悶熱。"]},
    {title:"切法", list:["茂谷：沿果蒂放射 4 刀 → 6 塊。","小香橘：整顆輕按再剝。","椪柑：直接手剝，冰過更爽口。"]}
  ];
  document.getElementById('schoolBox').innerHTML = data.map(d=>`
    <div class="school-card">
      <h3>${d.title}</h3>
      <ul class="muted">${d.list.map(li=>`<li>${li}</li>`).join('')}</ul>
    </div>`).join('');
}

/* ===== 評價（買過都說讚） ===== */
function toggleRv(open){ document.getElementById('rvPanel').classList.toggle('show', !!open); }
document.getElementById('rvPill').addEventListener('click',()=>toggleRv(true));
function maskName(name){ const s=String(name||'').trim(); if(s.length<=2) return s[0]+'○'; return s[0]+'○'.repeat(s.length-2)+s[s.length-1]; }
function genReviews(n=30){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","翔","修","均","凱"];
  const r=[]; for(let i=0;i<n;i++){ r.push({name:maskName(last[Math.floor(Math.random()*last.length)]+given[Math.floor(Math.random()*given.length)]), text: CONFIG.REVIEWS[Math.floor(Math.random()*CONFIG.REVIEWS.length)]}); }
  return r;
}
function renderReviews(){
  const list=genReviews(36);
  document.getElementById('rvList').innerHTML = list.map(x=>`
    <div class="rv"><span>🍊</span><b>${x.name}</b><span class="ok">都說讚</span><span class="muted" style="margin-left:auto">${x.text}</span></div>
  `).join('');
}

/* ===== 購物車 ===== */
const LS = { cart:'gx_cart', shipMethod:'gx_ship_method', form:'gx_form' };
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function addToCart(pid,title,price,weight,size,section){
  const existed = cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({ id:pid, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); bumpFab(); showToast('已加入預購清單');
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }

function getShipMethod(){ return localStorage.getItem(LS.shipMethod)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.shipMethod,m);
  document.getElementById('shipHomeBtn').className = (m==='HOME') ? 'btn' : 'btn-ghost';
  document.getElementById('shipPickBtn').className  = (m==='PICKUP')  ? 'btn' : 'btn-ghost';
  document.getElementById('homeFields').style.display = (m==='HOME') ? 'block':'none';
  document.getElementById('pickupFields').style.display  = (m==='PICKUP')  ? 'block':'none';
  document.getElementById('cashOnly').style.display  = (m==='PICKUP')  ? 'inline-flex':'none';
  renderCart();
}
function calc(){
  const method=getShipMethod();
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  let shipping=0; if(method==='PICKUP') shipping=0; else shipping=(subtotal>=CONFIG.FREE_SHIP_THRESHOLD||cart.length===0)?0:CONFIG.SHIPPING;
  return {subtotal,shipping,total:subtotal+shipping};
}
function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){ list.innerHTML='<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>'; }
  else{
    list.innerHTML=cart.map((c,i)=>`
      <div class="cart-row">
        <div>
          <div><strong>${c.title}</strong></div>
          <div class="note">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div class="qty">
          <button aria-label="減少" onclick="mutateQty(${i},-1)">–</button>
          <span>${c.qty}</span>
          <button aria-label="增加" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>`).join('');
  }
  const {subtotal,shipping,total}=calc();
  document.getElementById('subtotal').textContent=currency(subtotal);
  document.getElementById('shipping').textContent=currency(shipping);
  document.getElementById('total').textContent=currency(total);
  document.getElementById('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('shipLabel').textContent = getShipMethod()==='PICKUP'? '運費（自取免運）':'運費（宅配）';
}

/* ===== 送單＋付款 ===== */
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀「物流與退貨說明」並勾選同意'); return; }

  const f=new FormData(ev.target);
  const method=getShipMethod();
  for(const key of ['name','phone','email']) if(!f.get(key)) return alert('請完整填寫訂單資料');
  if(method==='HOME' && !f.get('addr')) return alert('請填寫宅配地址');

  const payload={
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr: method==='PICKUP' ? `自取｜台中市石岡區石岡街61號｜${f.get('pickupNote')||''}` : (f.get('addr')||''),
    ship: method==='PICKUP' ? '自取' : '宅配',
    remark:'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND_TAG
  };

  const payMethod = (document.querySelector('input[name="pay"]:checked')?.value) || 'LINEPAY';
  const btn=document.getElementById('submitBtn'); const resBox=document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; resBox.textContent='';

  try{
    const r1=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d1=await r1.json();
    if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
    const orderNo=d1.order_no;

    if(payMethod==='LINEPAY'){
      await goLinePay(orderNo, payload);
      return; // 導轉
    }else if(payMethod==='BANK'){
      resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於 24 小時內完成匯款並回報後五碼。\
        <div class="card content" style="margin-top:8px">\
          <div><b>${CONFIG.BANK.name}</b></div>\
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>\
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>\
        </div>`;
    }else{ // CASH
      resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於自取時現金付款，感謝！`;
    }
    cart.length=0; saveCart(); renderCart(); ev.target.reset();
  }catch(e){ resBox.textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

async function goLinePay(orderNo, payload){
  const amount=payload.summary.total;
  const body={ orderNo, amount, currency:CONFIG.PAY.currency, items:payload.items };
  const r=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_request', { method:'POST', body: JSON.stringify(body) });
  const d=await r.json();
  if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
  localStorage.setItem('gx_lp_orderNo', orderNo);
  localStorage.setItem('gx_lp_amount', String(amount));
  location.href = d.paymentUrl; // 導轉到 LINE Pay
}
(function handleLinePayReturn(){
  const params=new URLSearchParams(location.search);
  if(params.get('lp')==='return'){
    const orderNo=localStorage.getItem('gx_lp_orderNo');
    const amount=Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId=params.get('transactionId');
    if(orderNo && transactionId){
      (async()=>{
        try{
          const body={ orderNo, transactionId, amount, currency:CONFIG.PAY.currency };
          const r=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_confirm', { method:'POST', body: JSON.stringify(body) });
          const d=await r.json();
          if(d.ok){ showToast('付款成功，感謝支持！'); cart.length=0; saveCart(); renderCart(); localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount'); }
          else{ alert('付款確認失敗：'+(d.msg||'')); }
        }catch(e){ alert('付款確認錯誤：'+e.message); }
      })();
    }
  }
})();

/* ===== 訂單查詢 ===== */
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){ ev.preventDefault(); const f=new FormData(ev.target); const no=(f.get('orderNo')||'').trim(); const card=document.getElementById('queryCard'); card.style.display='block'; card.innerHTML='查詢中…'; try{ const url=CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no); const r=await fetch(url); const data=await r.json(); if(data.ok){ const s=data.status||'（未提供狀態）'; const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—'; const shipDate=data.shipDate?dateOnly(data.shipDate):'—'; const trackNo=data.trackingNo||'—'; const hctLink=`<a href="https://www.hct.com.tw/search/searchgoods_n.aspx" target="_blank" rel="noopener">新竹貨運查詢</a>`; const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—'; card.innerHTML=`<div style="display:flex; justify-content:space-between; align-items:center; gap:8px"><h3 style="margin:0">訂單查詢結果</h3><div class="note">${new Date().toLocaleString()}</div></div><div class="line"></div><div><b>訂單編號：</b>${no}</div><div><b>狀態：</b>${s}</div><div><b>出貨日期：</b>${shipDate}</div><div><b>物流單號：</b>${trackNo}</div><div><b>物流查詢：</b>${hctLink}</div><div><b>金額：</b>${total}</div><div><b>品項：</b>${items}</div>`; }else{ card.innerHTML='查無此訂單編號'; } }catch(e){ card.innerHTML='查詢錯誤：'+e.message; } }

/* ===== 表單條款必看到底才可勾選 ===== */
(function mustScrollPolicy(){
  const el=document.getElementById('policy'); const agree=document.getElementById('agree');
  el?.addEventListener('scroll',()=>{ const c=el.querySelector('.content'); if(!c) return; const bottom = el.scrollTop + el.clientHeight; if(bottom >= c.clientHeight+30) agree.disabled=false; },{passive:true});
})();

/* ===== 初始化 ===== */
function init(){
  document.querySelector('.hero-bg').style.backgroundImage = `url(${CONFIG.IMAGES.HERO})`;
  document.getElementById('img-pongan').src = CONFIG.IMAGES.PONGAN;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.MAOGAO;

  renderStories();
  renderGallery();
  ['PONGAN','MAOGAO'].forEach(renderSpecChips);

  renderGuide();
  renderTimeline();
  renderSchool();
  renderReviews();

  setShipMethod(getShipMethod());
  renderCart();

  // Rv pill拖移（可移到舒服位置）
  let dragging=false, startY=0, startTop=0; const pill=document.getElementById('rvPill');
  pill.addEventListener('mousedown',e=>{ dragging=true; startY=e.clientY; startTop=pill.offsetTop; e.preventDefault(); });
  window.addEventListener('mousemove',e=>{ if(!dragging) return; const dy=e.clientY-startY; pill.style.top = (startTop+dy)+'px'; });
  window.addEventListener('mouseup',()=>dragging=false);
}
document.addEventListener('DOMContentLoaded', init);

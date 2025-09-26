/***** 基本設定 *****/
const CONFIG = {
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160,
  FREE_SHIP: 1800,
  BRAND: "柑心果園",
  PRICES: {
    PONGAN: { "10台斤": { "23A": 750, "25A": 780, "27A": 820, "30A": 880 } },
    MAOGAO: { "10台斤": { "23A": 720, "25A": 760, "27A": 800, "30A": 860 } }
  },
  INVENTORY: {
    "PON10-23A":{sold:50, stock:200}, "PON10-25A":{sold:122, stock:678},
    "PON10-27A":{sold:66, stock:734}, "PON10-30A":{sold:55, stock:745},
    "MAO10-23A":{sold:72, stock:178}, "MAO10-25A":{sold:355, stock:545},
    "MAO10-27A":{sold:102, stock:698}, "MAO10-30A":{sold:78, stock:722}
  },
  SIZES_CM: { "23A":"約 6.0–6.5 cm", "25A":"約 6.5–7.0 cm", "27A":"約 7.0–7.5 cm", "30A":"約 7.5–8.0 cm" }
};
const LS = { cart:'gx_cart', form:'gx_form', ship:'gx_ship', guide:'gx_guide', lp:'gx_lp' };

/***** 小工具 *****/
const $ = (sel,doc=document)=>doc.querySelector(sel);
const $$= (sel,doc=document)=>[...doc.querySelectorAll(sel)];
const cur = n => 'NT$ '+(n||0).toLocaleString('en-US');

/***** 導覽 & Hero 輪播 *****/
(() => {
  const btn = $("#menuBtn"), nav = $("#mainNav");
  btn?.addEventListener("click", () => {
    const open = nav.style.display === "flex";
    nav.style.display = open ? "none" : "flex";
    btn.setAttribute("aria-expanded", String(!open));
  });

  const slides = $$(".hero-slide");
  let i = 0;
  function show(n){ slides.forEach((s,idx)=>s.classList.toggle('active', idx===n)); }
  show(0);
  setInterval(()=>{ i=(i+1)%slides.length; show(i); }, 6000);
})();

/***** 評價抽屜 *****/
$("#praisePill")?.addEventListener("click", ()=> $("#praiseDrawer").classList.add("open"));
$$("[data-close]").forEach(b=>b.addEventListener("click", e => e.target.closest(".drawer").classList.remove("open")));
(function renderReviews(){
  const list = Array.from({length:30}, (_,k)=>({
    name: ["陳","林","黃","張","李","王"][k%6]+"○"+(8+k),
    spec: ["23A","25A","27A","30A"][k%4],
    text: ["好甜又多汁，家人超愛","冰過更清爽","皮薄好剝，小孩一直拿","果香乾淨不膩"][k%4],
    date: new Date(Date.now()-k*86400000).toISOString().slice(0,10)
  }));
  $("#rvList").innerHTML = list.map(r=>`<div class="rv"><b>🍊 ${r.name}</b>　<span class="muted">${r.date}</span><div class="note">規格 ${r.spec}</div><div>${r.text}</div></div>`).join("");
})();

/***** 規格籤 & 產品卡 *****/
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };
function priceOf(section, weight, size){ return CONFIG.PRICES[section]?.[weight]?.[size] || 0; }

function renderSpec(kind){
  const id = kind==='PONGAN' ? 'specP' : 'specM';
  const out = $("#"+id);
  const sizes = ["23A","25A","27A","30A"];
  out.innerHTML = sizes.map(s=>`<button class="${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${s}</button>`).join("");
  const cm = CONFIG.SIZES_CM[SELECTED[kind]] || "";
  const pId = kind==='PONGAN'?'priceP':'priceM';
  const iId = kind==='PONGAN'?'invP':'invM';
  const weight = "10台斤";
  $("#"+pId).textContent = cur(priceOf(kind, weight, SELECTED[kind]));
  const pid = (kind==='PONGAN'?'PON10-':'MAO10-') + SELECTED[kind];
  const inv = CONFIG.INVENTORY[pid] || {sold:0,stock:0};
  $("#"+iId).textContent = `已售 ${inv.sold}｜剩 ${inv.stock} ｜ ${cm}`;
  localStorage.setItem(LS.guide, JSON.stringify(SELECTED));
}
function selectSpec(kind, s){ SELECTED[kind]=s; renderSpec(kind); }
renderSpec('PONGAN'); renderSpec('MAOGAO');

/***** 選購指南（沿用：量表＋尺寸同步） *****/
(function renderGuide(){
  const box = $("#guideBoard");
  function line(label, sweet, acid, aroma, size){
    const dot = n => `<span class="g-dot ${n?'on':''}"></span>`;
    const scale = v => {
      const on = Math.round(v);
      return `<span class="g-dots">${[1,2,3,4,5].map(i=>dot(i<=on)).join('')}</span>`;
    };
    return `<div class="g-line"><span class="g-key">${label}</span>
      <div>甜度 ${scale(sweet)}</div>
      <div>酸度 ${scale(acid)}</div>
      <div>香氣 ${scale(aroma)}</div>
      <div class="g-size">${size}</div>
    </div>`;
  }
  const sp = CONFIG.SIZES_CM[SELECTED.PONGAN];
  const sm = CONFIG.SIZES_CM[SELECTED.MAOGAO];
  box.innerHTML = line('椪柑',4,2,3, sp) + line('茂谷',4.5,2.5,4, sm);
})();

/***** 產季時間軸（小橘子） *****/
(function renderMonths(){
  const grid = $("#monthGrid");
  const items = [
    {m:10,t:'青皮椪柑',style:'green'},
    {m:11,t:'椪柑高峰',style:''},
    {m:12,t:'橙皮始｜茂谷',style:''},
    {m:1,t:'橙皮穩定',style:''},
    {m:2,t:'橙皮甜香',style:''},
    {m:3,t:'橙皮尾聲',style:''},
    {m:4,t:'儲藏柑',style:'pale'}
  ];
  const nowM = new Date().getMonth()+1;
  grid.innerHTML = items.map(it=>`
    <div class="m-card ${it.style} ${it.m===nowM?'active':''}">
      <div class="orange"><div class="leaf"></div></div>
      <div class="txt"><b>${it.m} 月</b><div class="muted">${it.t}</div></div>
    </div>`).join("");
})();

/***** 購物車 *****/
const cart = JSON.parse(localStorage.getItem(LS.cart)||'[]');
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); updateFab(); }
function updateFab(){ $("#fabCount").textContent = cart.reduce((s,i)=>s+i.qty,0); }
updateFab();

function addSelected(kind){
  const size = SELECTED[kind], weight='10台斤';
  const price = priceOf(kind, weight, size);
  const id = (kind==='PONGAN'?'PON10-':'MAO10-') + size;
  const title = (kind==='PONGAN'?'椪柑':'茂谷') + `｜${weight}｜${size}`;
  const existed = cart.find(x=>x.id===id);
  if(existed) existed.qty++;
  else cart.push({id,title,price,qty:1,weight,size,section:kind});
  saveCart(); renderCart(); openDrawer("#cartDrawer");
  toast('已加入購物車');
}

/* 抽屜控制 */
$("#cartFab")?.addEventListener("click", ()=>openDrawer("#cartDrawer"));
$("#queryFab")?.addEventListener("click", ()=>openDrawer("#queryDrawer"));
function openDrawer(sel){ const el=$(sel); el.classList.add("open"); }
$$(".drawer .x").forEach(x=>x.addEventListener("click", e=>e.target.closest(".drawer").classList.remove("open")));

/* 運送方式：宅配/自取 */
function getShip(){ return localStorage.getItem(LS.ship)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.ship, m);
  $("#shipHomeBtn").classList.toggle('active', m==='HOME');
  $("#shipPickBtn").classList.toggle('active', m==='PICKUP');
  $("#shipLabel").textContent = m==='HOME' ? '運費（宅配）' : '運費（自取）';
  $("#homeFields").style.display = m==='HOME' ? 'block':'none';
  $("#cashOpt").style.display   = m==='PICKUP' ? 'inline-flex':'none';
  renderCart();
}
setShipMethod(getShip());

function calc(){
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const m=getShip();
  let shipping = m==='HOME' ? (subtotal>=CONFIG.FREE_SHIP||!cart.length?0:CONFIG.SHIPPING) : 0;
  return {subtotal, shipping, total: subtotal+shipping};
}
function renderCart(){
  const list = $("#cartList");
  list.innerHTML = cart.length ? cart.map((c,i)=>`
    <div class="row" style="display:flex;justify-content:space-between;gap:8px;padding:6px 0">
      <div><b>${c.title}</b><div class="note">${cur(c.price)} × ${c.qty}</div></div>
      <div>
        <button onclick="chgQty(${i},-1)" class="chip">–</button>
        <button onclick="chgQty(${i},1)" class="chip">＋</button>
      </div>
    </div>`).join("") : '購物車是空的，去挑幾顆最頂的橘子吧 🍊';
  const s = calc();
  $("#subtotal").textContent = cur(s.subtotal);
  $("#shipping").textContent = cur(s.shipping);
  $("#total").textContent = cur(s.total);
}
function chgQty(i,d){ cart[i].qty+=d; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
renderCart();

/* 表單記憶（避免 iOS 放大：保持 16px） */
const F = $("#orderForm");
(function loadForm(){
  try{ const obj=JSON.parse(localStorage.getItem(LS.form)||'{}');
    for(const k in obj){ if(F[k]) F[k].value=obj[k]; }
  }catch{}
})();
$$("input,textarea,select", F).forEach(el=>el.addEventListener("input", ()=>{
  const data = Object.fromEntries(new FormData(F));
  localStorage.setItem(LS.form, JSON.stringify(data));
}));

/***** 下單與付款（LINE Pay appUrl 優先） *****/
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length) return alert('購物車是空的');
  if(!$("#agree").checked) return alert('請先勾選「物流與退貨說明」');

  const fd = new FormData(ev.target);
  const method = getShip();
  if(method==='HOME' && !fd.get('addr')) return alert('請填寫收件地址');

  const payload = {
    ts:new Date().toISOString(),
    name:fd.get('name'), phone:fd.get('phone'), email:fd.get('email'),
    addr: method==='HOME' ? fd.get('addr') : '自取（台中市石岡區石岡街61號）',
    ship: method==='HOME' ? '宅配' : '自取',
    remark:fd.get('remark')||'',
    items:cart.map(c=>({title:c.title,section:c.section,weight:c.weight,size:c.size,price:c.price,qty:c.qty})),
    summary:calc(),
    payMethod: (fd.get('pay')||'LINEPAY').toLowerCase()
  };

  const btn=$("#submitBtn"); btn.disabled=true; btn.textContent='處理中…'; $("#result").textContent='';
  try{
    // 建立訂單
    const r=await fetch(CONFIG.GAS_ENDPOINT,{method:'POST',body:JSON.stringify(payload)});
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');
    const orderNo = d.order_no;

    localStorage.setItem(LS.lp, JSON.stringify({ orderNo, total: payload.summary.total, returnTo: location.href }));

    if((fd.get('pay')||'LINEPAY')==='LINEPAY' && d.linepay){
      // 行動端優先 appUrl
      const ua = navigator.userAgent.toLowerCase();
      const appUrl = d.linepay.appUrl || d.linepay.webUrl;
      const webUrl = d.linepay.webUrl || appUrl;
      const target = /iphone|ipad|android|line/.test(ua) ? appUrl : webUrl;
      location.replace(target); // 不留下返回堆疊
      return;
    }else{
      // 匯款 / 現金
      toast(`訂單已建立（${orderNo}）`);
      cart.length=0; saveCart(); renderCart();
      ev.target.reset(); localStorage.removeItem(LS.form);
    }
  }catch(e){ $("#result").textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

/* LINE Pay 回來後：自動確認＋回到 #shop */
(async function handleLinePayReturn(){
  const u = new URL(location.href);
  const lp = u.searchParams.get('lp');
  const trans = u.searchParams.get('transactionId');
  if(lp==='return'){
    try{
      const keep = JSON.parse(localStorage.getItem(LS.lp)||'{}');
      if(keep.orderNo && trans){
        // 由 GAS doGet 版已處理確認；這裡只提示 & 回到 #shop
        toast('付款完成，感謝支持！');
        cart.length=0; saveCart(); renderCart();
      }
    }catch{}
    // 回商品區
    history.replaceState(null,'',u.pathname+u.hash); // 清掉 query
    location.hash = '#shop';
  }else if(lp==='cancel'){
    toast('您已取消付款，可改用匯款或重新下單');
    history.replaceState(null,'',u.pathname+u.hash);
  }
})();

/***** 訂單查詢 *****/
async function queryOrder(ev){
  ev.preventDefault();
  const no = new FormData(ev.target).get('orderNo').trim();
  const card = $("#queryCard"); card.style.display='block'; card.textContent='查詢中…';
  try{
    const r = await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no));
    const d = await r.json();
    if(!d.ok){ card.textContent='查無此訂單'; return; }
    const items=(d.items||[]).map(i=>`${i.title} × ${i.qty}`).join("、")||'—';
    card.innerHTML = `
      <div><b>訂單編號：</b>${d.orderNo}</div>
      <div><b>狀態：</b>${d.shipStatus||'—'}</div>
      <div><b>出貨日期：</b>${fmt(d.shipDate)}</div>
      <div><b>物流單號：</b>${d.trackingNo||'—'}</div>
      <div><b>金額：</b>${d.total?cur(d.total):'—'}</div>
      <div><b>品項：</b>${items}</div>`;
  }catch(e){ card.textContent='查詢失敗：'+e.message; }
}
function fmt(v){ if(!v) return '—'; const d=new Date(v); return isNaN(d)? String(v).slice(0,10): d.toISOString().slice(0,10); }

/***** 其他 *****/
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
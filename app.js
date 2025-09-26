/***** 基本設定（保持你的價格與庫存，可自行調整） *****/
const CONFIG = {
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160, FREE_SHIP: 1800, BRAND: "柑心果園",
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
const $ = (s,d=document)=>d.querySelector(s), $$=(s,d=document)=>[...d.querySelectorAll(s)];
const cur = n => 'NT$ '+(n||0).toLocaleString('en-US');

/***** 導覽折疊 *****/
(() => {
  const btn = $("#menuBtn"), nav = $("#mainNav");
  btn?.addEventListener("click", () => {
    const open = nav.style.display === "flex";
    nav.style.display = open ? "none" : "flex";
    btn.setAttribute("aria-expanded", String(!open));
  });
})();

/***** 品牌故事箭頭可滑 *****/
(() => {
  const track = $("#storyTrack");
  const prev = $(".car-prev"), next = $(".car-next");
  const step = () => Math.min(track.clientWidth, 520);
  prev.addEventListener("click", ()=> track.scrollBy({left:-step(), behavior:'smooth'}));
  next.addEventListener("click", ()=> track.scrollBy({left: step(), behavior:'smooth'}));
})();

/***** 評價抽屜（60 則不重複） *****/
$("#praisePill").addEventListener("click", ()=>$("#praiseDrawer").classList.add("open"));
$$("[data-close]").forEach(b=>b.addEventListener("click", e=>e.target.closest(".drawer").classList.remove("open")));
(function renderReviews(){
  const names = ["陳","林","黃","張","李","王","吳","周","蔡","楊","許","鄭","謝","洪","郭","曾","蕭","羅","賴","潘","簡","朱","胡","施","顏"];
  const words = ["果香乾淨","酸甜剛好","冰過更讚","孩子超愛","皮薄好剝","汁多不膩","長輩說好吃","甜度穩定","送禮體面","回購第三年","肉質細嫩","剛剛好的酸"];
  const list = [];
  for(let i=0;i<60;i++){
    const name = names[i%names.length] + ["小姐","先生"][i%2];
    const spec = ["23A","25A","27A","30A"][i%4];
    const text = words[(i*3)%words.length] + "，" + words[(i*5+2)%words.length] + "。";
    const date = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    list.push({name,spec,text,date});
  }
  $("#rvList").innerHTML = list.map(r=>`<div class="rv"><b>🍊 ${r.name}</b>　<span class="muted">${r.date}</span><div class="note">規格 ${r.spec}</div><div>${r.text}</div></div>`).join("");
})();

/***** 規格 + 產品卡 + 內嵌量表（合併選購指南） *****/
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };
function score(kind){ return kind==='PONGAN' ? {sweet:4, acid:2, aroma:3} : {sweet:4.5, acid:2.5, aroma:4}; }
function priceOf(kind, weight, size){ return CONFIG.PRICES[kind]?.[weight]?.[size] || 0; }
function dot(n,on){ return `<span class="g-dot ${n<=on?'on':''}"></span>`; }
function scale(v){ const on=Math.round(v); return `<span class="g-dots">${[1,2,3,4,5].map(i=>dot(i,on)).join('')}</span>`; }

function renderMini(kind){
  const s = score(kind), cm = CONFIG.SIZES_CM[SELECTED[kind]] || "";
  const html = `
    <div class="g"><b>甜度</b>${scale(s.sweet)}</div>
    <div class="g"><b>酸度</b>${scale(s.acid)}</div>
    <div class="g"><b>香氣</b>${scale(s.aroma)}</div>
    <div class="g size">尺寸｜${cm}</div>`;
  (kind==='PONGAN' ? $("#miniP") : $("#miniM")).innerHTML = html;
}
function renderSpec(kind){
  const host = (kind==='PONGAN' ? $("#specP") : $("#specM"));
  const sizes = ["23A","25A","27A","30A"];
  host.innerHTML = sizes.map(s=>`<button class="${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${s}</button>`).join("");
  const weight='10台斤'; const pid=(kind==='PONGAN'?'PON10-':'MAO10-')+SELECTED[kind];
  const inv = CONFIG.INVENTORY[pid] || {sold:0,stock:0};
  (kind==='PONGAN'?$("#priceP"):$("#priceM")).textContent = cur(priceOf(kind,weight,SELECTED[kind]));
  (kind==='PONGAN'?$("#invP"):$("#invM")).textContent = `已售 ${inv.sold}｜剩 ${inv.stock}｜${CONFIG.SIZES_CM[SELECTED[kind]]}`;
  renderMini(kind);
  localStorage.setItem(LS.guide, JSON.stringify(SELECTED));
}
function selectSpec(kind, s){ SELECTED[kind]=s; renderSpec(kind); }
renderSpec('PONGAN'); renderSpec('MAOGAO');

/***** 產季時間軸（橫向兩行） *****/
(function renderTimeline(){
  const nowM = new Date().getMonth()+1;
  const pon = [
    {m:10, t:'青皮', k:'green'}, {m:11,t:'高峰',k:''},{m:12,t:'橙皮始',k:''},
    {m:1,t:'穩定',k:''},{m:2,t:'甜香',k:''},{m:3,t:'尾聲',k:''},{m:4,t:'儲藏',k:'pale'}
  ];
  const mao = [{m:12,t:'初採',k:''},{m:1,t:'高峰',k:''},{m:2,t:'甜',k:''}];
  const tpl = it => `<div class="tl-card"><div class="tl-o ${it.k||''}"></div><div class="tl-t"><b>${it.m}月</b><div class="muted">${it.t}</div></div></div>`;
  $("#tlPon").innerHTML = pon.map(tpl).join("");
  $("#tlMao").innerHTML = mao.map(tpl).join("");
  // 略為捲到接近當月
  const idx = pon.findIndex(x=>x.m===nowM); if(idx>0) $("#tlPon").scrollLeft = Math.max(0, idx-1)*108;
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
  saveCart(); renderCart(); openDrawer("#cartDrawer"); toast('已加入購物車');
}

/* 浮動抽屜 */
$("#cartFab").addEventListener("click", ()=>openDrawer("#cartDrawer"));
$("#queryFab").addEventListener("click", ()=>openDrawer("#queryDrawer"));
function openDrawer(sel){ $(sel).classList.add("open"); }
function closeCart(){ $("#cartDrawer").classList.remove("open"); }
function clearCart(){ cart.length=0; saveCart(); renderCart(); }
$$(".drawer .x").forEach(x=>x.addEventListener("click", e=>e.target.closest(".drawer").classList.remove("open")));

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

/* 表單記憶 */
const F = $("#orderForm");
(function loadForm(){ try{ const obj=JSON.parse(localStorage.getItem(LS.form)||'{}'); for(const k in obj){ if(F[k]) F[k].value=obj[k]; } }catch{} })();
$$("input,textarea,select", F).forEach(el=>el.addEventListener("input", ()=>{
  const data = Object.fromEntries(new FormData(F)); localStorage.setItem(LS.form, JSON.stringify(data));
}));

/***** 下單與付款（LINE Pay：appUrl→webUrl fallback；only success shows toast） *****/
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
    const r=await fetch(CONFIG.GAS_ENDPOINT,{method:'POST',body:JSON.stringify(payload)});
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');
    const orderNo = d.order_no;

    // 記錄（供回來後顯示）
    localStorage.setItem(LS.lp, JSON.stringify({ orderNo, total: payload.summary.total }));

    if((fd.get('pay')||'LINEPAY')==='LINEPAY' && d.linepay){
      // 嘗試打開 LINE appUrl，1.2 秒 fallback webUrl
      const appUrl = d.linepay.appUrl || d.linepay.webUrl;
      const webUrl = d.linepay.webUrl || appUrl;
      let jumped=false;
      const t = setTimeout(()=>{ if(!jumped){ jumped=true; location.href = webUrl; } }, 1200);
      try{ location.href = appUrl; }catch(e){ clearTimeout(t); location.href = webUrl; }
      return;
    }else{
      // 匯款 / 現金
      toast(`訂單已建立（${orderNo}）`);
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); localStorage.removeItem(LS.form);
    }
  }catch(e){ $("#result").textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

/* LINE Pay 返回（僅提示，不自行假設成功） */
(function handleLinePayReturn(){
  const u = new URL(location.href);
  if (u.searchParams.get('lp') === 'return') {
    toast('已返回商店頁'); history.replaceState(null,'',u.pathname+u.hash); location.hash='#shop';
  } else if (u.searchParams.get('lp') === 'cancel') {
    toast('您已取消付款'); history.replaceState(null,'',u.pathname+u.hash);
  }
})();

/***** 訂單查詢 *****/
$("#queryFab").addEventListener("click", ()=>$("#queryDrawer").classList.add("open"));
async function queryOrder(ev){
  ev.preventDefault();
  const no = new FormData(ev.target).get('orderNo').trim();
  const card = $("#queryCard"); card.style.display='block'; card.textContent='查詢中…';
  try{
    const r = await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no));
    const d = await r.json();
    if(!d.ok){ card.textContent='查無此訂單'; return; }
    const items=(d.items||[]).map(i=>`${i.title} × ${i.qty}`).join("、")||'—';
    card.innerHTML = `<div><b>訂單編號：</b>${d.orderNo}</div>
      <div><b>狀態：</b>${d.shipStatus||'—'}</div>
      <div><b>出貨日期：</b>${fmt(d.shipDate)}</div>
      <div><b>物流單號：</b>${d.trackingNo||'—'}</div>
      <div><b>金額：</b>${d.total?cur(d.total):'—'}</div>
      <div><b>品項：</b>${items}</div>`;
  }catch(e){ card.textContent='查詢失敗：'+e.message; }
}
function fmt(v){ if(!v) return '—'; const d=new Date(v); return isNaN(d)? String(v).slice(0,10): d.toISOString().slice(0,10); }

/***** 小工具 *****/
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
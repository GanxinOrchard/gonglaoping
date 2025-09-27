/*****************
 * 基本設定
 *****************/
const CONFIG = {
  BRAND: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160,
  FREE_SHIP: 1800,
  COUPONS: {
    GX200OFF: { type: 'flat', amount: 200, validUntil: '2026-04-30' },
    GX90:     { type: 'percent', pct: 10, validUntil: '2026-04-30' }
  },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    BOX:  toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    FRUITS: [
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg"),
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D2.jpg"),
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D3.jpg"),
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
  DIAMETER_CM: { // 估值（A數越小越大顆）
    "23A":"約 8.0–8.5 cm",
    "25A":"約 7.5–8.0 cm",
    "27A":"約 7.0–7.5 cm",
    "30A":"約 6.5–7.0 cm"
  }
};

const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` }
};
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };

const LS = { cart:'gx_cart', form:'gx_form', ship:'gx_ship', coupon:'gx_coupon' };

/*****************
 * 工具
 *****************/
function toRaw(u){ return u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/'); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (sec,weight,size)=> CONFIG.PRICES[sec]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id]||'normal'; }
function showToast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
const $ = sel => document.querySelector(sel);

/*****************
 * 初始化：圖片與卡片
 *****************/
document.addEventListener('DOMContentLoaded', () => {
  // Hero 背景（已在 CSS 以 --hero 設定）
  // 產品圖片
  $('#img-pongan').src = CONFIG.IMAGES.BOX;
  $('#img-maogao').src = CONFIG.IMAGES.BOX;

  // 規格籤
  renderSpec('PONGAN'); renderSpec('MAOGAO');

  // 輪播啟動
  initCarousels();

  // 產季時間軸
  buildMonths();

  // 載入購物車
  renderCart();

  // 表單記憶
  loadForm();

  // 觀察 policy 捲到底才可勾選
  guardPolicy();

  // FAB 綁定
  $('#cartFab').onclick = ()=>toggleCart(true);
  $('#queryFab').onclick = ()=>toggleQuery(true);
  $('#reviewFab').onclick = ()=>toggleReview(true);

  // 生成 100 則不重複評價
  buildReviews();
});

/*****************
 * 輪播
 *****************/
function initCarousels(){
  document.querySelectorAll('.carousel').forEach(car=>{
    const track = car.querySelector('.car-track');
    const prev = car.querySelector('.car-btn.prev');
    const next = car.querySelector('.car-btn.next');
    const step = ()=> track.scrollBy({left:track.clientWidth,behavior:'smooth'});
    const back = ()=> track.scrollBy({left:-track.clientWidth,behavior:'smooth'});
    prev && (prev.onclick=back);
    next && (next.onclick=step);
    const ms = Number(car.dataset.autoplay||0);
    if(ms>0){
      let timer = setInterval(step, ms);
      car.addEventListener('pointerenter',()=>clearInterval(timer));
      car.addEventListener('pointerleave',()=> timer=setInterval(step, ms));
    }
  });
}

/*****************
 * 產季時間軸
 *****************/
function buildMonths(){
  const p = [
    {m:10,t:'青皮'}, {m:11,t:'高峰'}, {m:12,t:'橙皮始'}, {m:1,t:'橙皮穩'}, {m:2,t:'橙皮甜'}, {m:3,t:'尾聲'}, {m:4,t:'儲藏'}
  ];
  const m = [
    {m:12,t:'開採'}, {m:1,t:'穩定'}, {m:2,t:'香甜'}, {m:3,t:'收尾'}
  ];
  const mp = $('#months-pongan'); const mm = $('#months-maogao');
  mp.innerHTML = p.map((x,i)=>monthHtml(x.m, x.t, i)).join('');
  mm.innerHTML = m.map((x,i)=>monthHtml(x.m, x.t, i)).join('');
}
function monthHtml(m, note, idx){
  // 綠 → 橘 漸變
  const g = Math.max(0, 180 - idx*35);
  const color = idx===0 ? '#6ee7b7' : `hsl(${30+idx*12}, 90%, 60%)`;
  return `<div class="month">
    <div class="ball" style="background:${idx===0?'#34d399':color}"></div>
    <b>${m} 月</b>
    <div class="note">${note}</div>
  </div>`;
}

/*****************
 * 規格與價格
 *****************/
function renderSpec(kind){
  const conf=PRODUCTS[kind];
  const rail = document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  updatePriceInv(kind);
}
function selectSpec(kind,size){ SELECTED[kind]=size; updatePriceInv(kind); }
function updatePriceInv(kind){
  const conf=PRODUCTS[kind];
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  $('#price-'+kind.toLowerCase()).textContent = currency(price);
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  $('#inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock}`;
  // 尺寸直徑顯示
  const sizeText = CONFIG.DIAMETER_CM[SELECTED[kind]] || '—';
  $('#size-'+kind.toLowerCase()).textContent = sizeText;
}

/*****************
 * 購物車
 *****************/
const cart = (()=>{ try{ return JSON.parse(localStorage.getItem(LS.cart)||'[]'); }catch{return []} })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=$('#cartFab'); f.style.transform='scale(1.06)'; setTimeout(()=>f.style.transform='',180); }
function addSelected(kind){
  const conf=PRODUCTS[kind]; const size=SELECTED[kind]; const pid=conf.getId(size);
  const price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  if(statusOf(pid)==='soldout'){ showToast('此品項已售完'); return; }
  const existed=cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({id:pid,title,price,qty:1,weight:conf.weight,size,section:conf.section});
  saveCart(); renderCart(); bumpFab();
  showToast('已加入預購清單');
}
function mutateQty(i,d){ cart[i].qty+=d; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ $('#cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ $('#queryDrawer').classList.toggle('open', !!open); }
function toggleReview(open){ $('#reviewDrawer').classList.toggle('open', !!open); }

function getShipMethod(){ return localStorage.getItem(LS.ship)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.ship,m);
  $('#shipHomeBtn').className = (m==='HOME') ? 'btn mini' : 'btn mini ghost';
  $('#shipPickupBtn').className= (m==='PICKUP') ? 'btn mini' : 'btn mini ghost';
  $('#homeFields').style.display = (m==='HOME')?'block':'none';
  $('#pickupFields').style.display= (m==='PICKUP')?'block':'none';
  renderCart();
}
function calc(){
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const m=getShipMethod();
  const shipping = m==='PICKUP' ? 0 : (subtotal>=CONFIG.FREE_SHIP||!cart.length?0:CONFIG.SHIPPING);
  const coupon = getCoupon();
  let discount = 0;
  if(coupon){
    if(coupon.type==='flat') discount = Math.min(coupon.amount, subtotal);
    if(coupon.type==='percent') discount = Math.floor(subtotal * (coupon.pct/100));
  }
  const total = Math.max(0, subtotal + shipping - discount);
  return {subtotal, shipping, discount, total};
}
function renderCart(){
  // 列表
  const list = $('#cartList');
  if(!cart.length){
    list.innerHTML = '<div class="note">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>';
  }else{
    list.innerHTML = cart.map((c,i)=>`
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
      </div>
    `).join('');
  }
  const {subtotal,shipping,discount,total} = calc();
  $('#subtotal').textContent = currency(subtotal);
  $('#shipping').textContent = currency(shipping);
  $('#discount').textContent = discount? ('− '+currency(discount)) : '− NT$ 0';
  $('#total').textContent = currency(total);

  const m=getShipMethod();
  $('#shipLabel').textContent = m==='PICKUP' ? '運費（自取免運）' : '運費（宅配）';

  // 同步付款方式：自取預設現金
  const pay = document.querySelector('input[name="pay"][value="CASH"]');
  if(m==='PICKUP' && pay) pay.checked = true;
}

function applyCoupon(){
  const code = ($('#couponInput').value||'').trim().toUpperCase();
  const def = CONFIG.COUPONS[code];
  const box = $('#couponMsg');
  if(!def){ localStorage.removeItem(LS.coupon); box.textContent='折扣碼無效'; renderCart(); return; }
  if(def.validUntil && new Date() > new Date(def.validUntil+'T23:59:59')){ box.textContent='折扣碼已過期'; localStorage.removeItem(LS.coupon); renderCart(); return; }
  localStorage.setItem(LS.coupon, code);
  box.textContent = '已套用：'+code;
  renderCart();
}
function getCoupon(){
  const code = localStorage.getItem(LS.coupon);
  if(!code) return null;
  const def = CONFIG.COUPONS[code];
  if(!def) return null;
  if(def.validUntil && new Date() > new Date(def.validUntil+'T23:59:59')) return null;
  return def;
}

/*****************
 * 表單記憶＆Policy鎖
 *****************/
function saveForm(){
  const f=$('#orderForm');
  const obj=Object.fromEntries(new FormData(f));
  obj.ship = getShipMethod();
  localStorage.setItem(LS.form, JSON.stringify(obj));
}
function loadForm(){
  try{
    const s=localStorage.getItem(LS.form); if(!s) return;
    const obj=JSON.parse(s);
    const f=$('#orderForm');
    Object.keys(obj).forEach(k=>{ if(f[k]) f[k].value=obj[k]; });
    setShipMethod(obj.ship||'HOME');
  }catch{}
}
function guardPolicy(){
  const box=$('#policy'); const agree=$('#agree');
  const content=box.querySelector('.content');
  box.addEventListener('toggle', ()=>{ if(box.open) content.scrollTop=0; });
  content.addEventListener('scroll', ()=>{
    const nearBottom = content.scrollTop + content.clientHeight + 10 >= content.scrollHeight;
    agree.disabled = !nearBottom;
  });
  document.getElementById('orderForm').addEventListener('input', saveForm);
}

/*****************
 * 送單＆LINE Pay
 *****************/
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  if($('#agree').disabled || !$('#agree').checked){ alert('請先展開「物流與退貨說明」並捲到最底勾選同意'); return; }

  const f = new FormData(ev.target);
  const shipMethod = getShipMethod();
  if(shipMethod==='HOME' && !f.get('addr')){ alert('請填寫宅配地址'); return; }

  const items = cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty}));
  const summary = calc();

  const payload = {
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr: shipMethod==='PICKUP' ? '自取（台中市石岡區石岡街61號）' : f.get('addr'),
    ship: shipMethod==='PICKUP' ? '自取' : '宅配',
    remark:f.get('remark')||'',
    items, summary, brand: CONFIG.BRAND,
    payMethod: (f.get('pay')||'LINEPAY').toLowerCase()==='linepay' ? 'linepay' : 'bank'
  };

  const btn=$('#submitBtn'); const res=$('#result');
  btn.disabled=true; btn.textContent='送出訂單中，請稍候…'; res.textContent='';

  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');

    const paySel = (f.get('pay')||'LINEPAY').toUpperCase();
    if(paySel==='LINEPAY'){
      const web = d?.linepay?.webUrl, app = d?.linepay?.appUrl;
      if(app && /Android|iPhone|iPad/i.test(navigator.userAgent)) location.href = app;
      else if(web) location.href = web;
      else throw new Error('LINE Pay 付款連結取得失敗');
      // 不在這裡清空，等返回成功頁再處理（後端）
    }else{
      // 匯款 / 自取
      res.innerHTML = `✅ 訂單已建立（編號：<b>${d.order_no||''}</b>）。我們將盡快為您安排。`;
      cart.length=0; saveCart(); renderCart();
      ev.target.reset(); saveForm();
    }
  }catch(e){
    res.textContent = '送出失敗：'+e.message;
  }finally{
    btn.disabled=false; btn.textContent='送出訂單';
  }
}

/*****************
 * 訂單查詢
 *****************/
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target);
  const no=(f.get('orderNo')||'').trim();
  const card=$('#queryCard'); card.style.display='block'; card.innerHTML='查詢中…';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no));
    const data=await r.json();
    if(data.ok){
      const items = (data.items||[]).map(i=>`${i.title} × ${i.qty}`).join('、') || '—';
      const total = data.total ? currency(data.total) : '—';
      const shipDate = data.shipDate || '—';
      const trackNo = data.trackingNo || '—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">訂單 ${no}</h3><div class="note">${new Date().toLocaleString()}</div></div>
        <div class="line"></div>
        <div><b>狀態：</b>${data.status||'—'}</div>
        <div><b>出貨日期：</b>${shipDate}</div>
        <div><b>物流單號：</b>${trackNo}</div>
        <div><b>金額：</b>${total}</div>
        <div><b>品項：</b>${items}</div>`;
    }else{
      card.textContent='查無此訂單編號';
    }
  }catch(e){ card.textContent='查詢失敗：'+e.message; }
}

/*****************
 * 評價生成（100 則、產季日期）
 *****************/
function buildReviews(){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","熒","容","翔","修","均","凱"];
  const pos = ["甜度高又多汁","清爽不膩口","香氣自然不刺鼻","小孩也愛吃","回購好幾次","顆顆飽滿","冰過更讚","價位實在"];
  const pos2 = ["送禮體面","剝皮方便","口感細嫩","果香乾淨","品質穩定","不用挑就好吃","家人都稱讚","今年這批特別好"];
  const three = ["稍微酸一點但很開胃","有幾顆較小顆但整體不錯"];
  const sizes=["23A","25A","27A","30A"];
  const list=[];
  const year = new Date().getMonth()+1>=10 ? new Date().getFullYear() : new Date().getFullYear()-1; // 產季跨年
  function rand(a){return a[Math.floor(Math.random()*a.length)];}
  function dateInSeason(){
    // 10~12 與 次年 1~3
    const pools = [];
    for(let m=10;m<=12;m++) pools.push([year,m]);
    for(let m=1;m<=3;m++) pools.push([year+1,m]);
    const [yy,mm]=rand(pools); const dd=String(1+Math.floor(Math.random()*26)).padStart(2,'0');
    return `${yy}-${String(mm).padStart(2,'0')}-${dd}`;
  }
  for(let i=0;i<100;i++){
    const name = rand(last)+rand(given)+rand(given).replace(/(.).*/,'$1');
    let star=5, text=rand(pos)+'，'+rand(pos2), spec=`10台斤｜${rand(sizes)}`;
    if(i===7 || i===53){ star=3; text=rand(three); }
    list.push({ name: maskName(name), date: dateInSeason(), spec, stars: star, text });
  }
  const track = $('#reviewsTrack');
  track.innerHTML = list.map(r=>reviewCard(r)).join('');
  initCarousels();
}
function maskName(s){ const t=String(s||''); if(t.length<=2) return t[0]+'○'; return t[0]+'○'.repeat(t.length-2)+t.slice(-1); }
function reviewCard(r){
  const chips = r.stars===3 ? '🟠🟠🟠' : r.stars===4 ? '🟠🟠🟠🟠' : '🟠🟠🟠🟠🟠';
  return `<article class="story-card">
    <div style="display:flex;align-items:center;gap:10px"><span>🍊</span><b>${r.name}</b><span class="note">${r.date}</span></div>
    <div class="note">購買：${r.spec}　評價：${chips}</div>
    <p style="margin:6px 0 0">${r.text}</p>
  </article>`;
}

/*****************
 * 小工具
 *****************/
function $(sel){ return document.querySelector(sel); }

/* 讓 policy 內容高度變化時也能監聽（保險） */
new ResizeObserver(()=>{}).observe(document.body);
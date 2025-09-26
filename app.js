/*****************
 * 設定與資料
 *****************/
const CONFIG = {
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    LOGO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png"),
    PRODUCT10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    PONGAN_CLOSE: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    MAOGAO_CLOSE: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png")
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
  DIAMETER_CM: { "23A":"約 7.8–8.4 cm", "25A":"約 7.5–7.8 cm", "27A":"約 7.2–7.5 cm", "30A":"約 6.8–7.2 cm" }
};
function toRaw(u){return !u?u:(u.includes('raw.githubusercontent.com')?u:u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (section,weight,size)=> CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id] || 'normal'; }

/*****************
 * 導覽與 Hero
 *****************/
document.querySelector('.brand-logo').src = CONFIG.IMAGES.LOGO;
document.getElementById('heroLogo').src = CONFIG.IMAGES.LOGO;
document.querySelector('.hero-bg').style.backgroundImage = `url('${CONFIG.IMAGES.HERO}')`;

const hamburger = document.getElementById('hamburger');
const siteNav = document.getElementById('siteNav');
hamburger.addEventListener('click', ()=> siteNav.classList.toggle('open'));

/*****************
 * 品牌故事輪播
 *****************/
const STORY_TEXTS = [
  {title:"從山坡到你家", body:"我們在公老坪與東勢，跟著老欉的節奏採收。每一箱，都能追溯到批次與採收日。"},
  {title:"簡單做，慢慢來", body:"堅持手工分級、只做必要處理。讓果皮不完美，換來更完整的風味。"},
  {title:"把理賠講清楚", body:"到貨請開箱錄影，若有運損 24 小時內回報。怎麼做，我們就怎麼賠。"}
];
const sc = document.getElementById('storyCarousel');
const sd = document.getElementById('storyDots');
let storyIndex = 0;
function renderStory(){
  sc.innerHTML = STORY_TEXTS.map((s,i)=>`
    <div class="story-slide ${i===storyIndex?'active':''}">
      <h3>${s.title}</h3>
      <p class="muted">${s.body}</p>
    </div>`).join('');
  sd.innerHTML = STORY_TEXTS.map((_,i)=>`<button class="story-dot ${i===storyIndex?'active':''}" onclick="setStory(${i})"></button>`).join('');
}
function setStory(i){ storyIndex = i; renderStory(); }
setInterval(()=>{storyIndex=(storyIndex+1)%STORY_TEXTS.length; renderStory();}, 4500);
renderStory();

/*****************
 * 側邊滑出 KPI：進入視窗範圍時顯示
 *****************/
const floating = document.getElementById('floatingKpis');
const observer = new IntersectionObserver((ents)=>{
  ents.forEach(e=>{ if(e.isIntersecting) floating.classList.add('show'); });
},{threshold:.2});
observer.observe(document.getElementById('shop'));

/*****************
 * 產品規格與渲染
 *****************/
const PRODUCTS = {
  PONGAN: { section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`PON10-${s}` },
  MAOGAO: { section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`MAO10-${s}` }
};
const SELECTED = { PONGAN:"25A", MAOGAO:"25A" };

document.getElementById('img-pongan').src = CONFIG.IMAGES.PRODUCT10;
document.getElementById('img-maogao').src = CONFIG.IMAGES.PRODUCT10;

function dotBar(n){
  let s=''; for(let i=0;i<5;i++) s+=`<span class="dot ${i<n?'on':''}"></span>`; return s;
}
function renderMeter(target, kind){
  // 椪柑：甜4、酸2、香3；茂谷：甜4.5、酸2.5、香4 → 四捨五入顯示
  const spec = (kind==='PONGAN') ? {甜:4, 酸:2, 香:3} : {甜:5, 酸:3, 香:4};
  target.innerHTML = Object.entries(spec).map(([k,v])=>`
    <span class="tag">${k}</span><span class="dots">${dotBar(Math.round(v))}</span>
  `).join('');
}
function renderSpec(kind){
  const conf = PRODUCTS[kind];
  const rail = document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`
    <button class="chip ${SELECTED[kind]===s?'on':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>
  `).join('');
  document.getElementById('size-'+kind.toLowerCase()).textContent = `尺寸：${CONFIG.DIAMETER_CM[SELECTED[kind]] || "—"}`;
  document.getElementById('price-'+kind.toLowerCase()).textContent =
    currency(priceOf(conf.section, conf.weight, SELECTED[kind]));
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid] || {sold:0, stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}｜剩餘 ${inv.stock}`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpec(kind); }
renderMeter(document.getElementById('meter-pongan'),'PONGAN');
renderMeter(document.getElementById('meter-maogao'),'MAOGAO');
renderSpec('PONGAN'); renderSpec('MAOGAO');

/*****************
 * 果實近拍：1:1 卡片式輪播
 *****************/
const gallery = [
  CONFIG.IMAGES.PONGAN_CLOSE,
  CONFIG.IMAGES.MAOGAO_CLOSE,
  CONFIG.IMAGES.PRODUCT10
];
const gRail = document.getElementById('galleryRail');
gRail.innerHTML = gallery.map(src=>`
  <div class="g-item"><img src="${src}" alt="果實近拍"></div>
`).join('');

/*****************
 * 產季時間軸
 *****************/
const months = [
  {m:'10',t:'青皮椪柑'}, {m:'11',t:'椪柑高峰'}, {m:'12',t:'橙皮始｜茂谷'},
  {m:'1',t:'橙皮穩定'}, {m:'2',t:'橙皮甜香'}, {m:'3',t:'橙皮尾聲'}, {m:'4',t:'儲藏柑'}
];
document.getElementById('timelineMonths').innerHTML = months.map(x=>`
  <div class="month"><b>${x.m} 月</b><div class="muted">${x.t}</div></div>
`).join('');

/*****************
 * 流程：小圓按鈕 → 詳細卡
 *****************/
const FLOW_TEXT = {
  1:"1. 下單預購：選規格加入購物車，付款 LINE Pay / 匯款 / 自取現金。",
  2:"2. 現採分級裝箱：依成熟度與等級上架，堅持手工分級。",
  3:"3. 出貨通知：簡訊/Email/LINE 通知出貨與追蹤碼。",
  4:"4. 到貨開箱：請全程錄影保障理賠，冷藏更清甜。"
};
const flowDetail = document.getElementById('flowDetail');
document.querySelectorAll('.circle').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const s=btn.dataset.step; flowDetail.innerHTML = `<div class="flow-card">${FLOW_TEXT[s]}</div>`;
  });
});

/*****************
 * 好評：膠囊條
 *****************/
function genNames(n=40){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","妤","柔","軒","瑜","嘉","翔","修","均","凱"];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const mask = s => s.length<=2 ? s[0]+'○' : s[0]+'○'.repeat(s.length-2)+s[s.length-1];
  return Array.from({length:n},()=> mask(pick(last)+pick(given)+pick(given)));
}
const rvRail = document.getElementById('rvRail');
rvRail.innerHTML = genNames(36).map(n=>`<div class="rv">🍊 ${n}：買過都說讚</div>`).join('');

/*****************
 * 購物車邏輯
 *****************/
const LS = { cart:'gx_cart2', ship:'gx_ship2', form:'gx_form2' };
const cart = (()=>{ try{const s=localStorage.getItem(LS.cart); return s?JSON.parse(s):[];}catch{return [];} })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function addToCart(pid,title,price,weight,size,section){
  if(statusOf(pid)==='soldout'){ toast('此品項已售完'); return; }
  const existed=cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({id:pid,title,price,qty:1,weight,size,section});
  saveCart(); renderCart(); bumpFab(); toast('已加入購物車');
}
function addSelected(kind){
  const conf=PRODUCTS[kind]; const size=SELECTED[kind];
  const pid = conf.getId(size);
  const price = priceOf(conf.section, conf.weight, size);
  const title = (kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size,conf.section);
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }

function getShipMethod(){ return localStorage.getItem(LS.ship)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.ship,m);
  document.getElementById('shipHomeBtn').classList.toggle('on', m==='HOME');
  document.getElementById('shipPickupBtn').classList.toggle('on', m==='PICKUP');
  document.getElementById('shipDoorBtn').classList.toggle('on', m==='DOOR');
  const shipSel=document.querySelector('select[name="ship"]');
  if(shipSel){
    shipSel.value = (m==='HOME'?'宅配': m==='PICKUP'?'自取（現金）':'到門服務（台中≥5箱）');
  }
  renderCart();
}

function boxesCount(){ return cart.reduce((s,i)=> s + (i.weight==='10台斤'? i.qty: 0), 0); }

function calc(){
  const method=getShipMethod();
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  let shipping=0;
  if(method==='HOME'){
    shipping = (subtotal>=CONFIG.FREE_SHIP_THRESHOLD||cart.length===0)?0:CONFIG.SHIPPING;
  }else if(method==='PICKUP'){
    shipping = 0;
  }else if(method==='DOOR'){
    // 台中 ≥5 箱免運；不足不得選
    shipping = 0;
  }
  return {subtotal, shipping, total: subtotal+shipping};
}

function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){ list.innerHTML = `<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>`; }
  else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="cart-row">
        <div>
          <div><strong>${c.title}</strong></div>
          <div class="note">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div class="qty">
          <button onclick="mutateQty(${i},-1)">–</button>
          <span>${c.qty}</span>
          <button onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>
    `).join('');
  }
  const {subtotal,shipping,total}=calc();
  el('subtotal').textContent=currency(subtotal);
  el('shipping').textContent=currency(shipping);
  el('total').textContent=currency(total);
  el('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);

  const method=getShipMethod();
  el('shipLabel').textContent = (method==='HOME')? '運費（宅配）' : (method==='PICKUP')? '運費（自取）' : '運費（到門）';
  el('homeFields').style.display = (method==='HOME' || method==='DOOR') ? 'block':'none';
  el('pickupHint').style.display = (method==='PICKUP') ? 'block' : 'none';

  // 到門服務檢查
  const note = (method==='DOOR' && boxesCount()<5) ? '（到門需台中市且 ≥5 箱，未達請改選宅配/自取）' : '';
  el('shipNote').innerHTML = `宅配：滿 <b id="freeShipText">NT$ ${CONFIG.FREE_SHIP_THRESHOLD.toLocaleString()}</b> 免運；自取/到門免運。<span class="muted">${note}</span>`;
}
function el(id){ return document.getElementById(id); }
renderCart(); setShipMethod(getShipMethod());

/*****************
 * 條款滾到底啟用
 *****************/
(function setupPolicy(){
  const det = document.getElementById('policy');
  const agree = document.getElementById('agree');
  const enableIfBottom = ()=>{
    const sc = det.scrollTop + det.clientHeight;
    const need = det.scrollHeight - 10;
    if(sc >= need){ agree.disabled = false; }
  };
  det.addEventListener('toggle', ()=>{ if(det.open){ det.focus(); }});
  det.addEventListener('scroll', enableIfBottom, {passive:true});
})();

/*****************
 * 送單 + 付款
 *****************/
function saveForm(){ const f=document.getElementById('orderForm'); const obj=Object.fromEntries(new FormData(f)); obj.shipMethod=getShipMethod(); localStorage.setItem(LS.form, JSON.stringify(obj)); }
function loadForm(){ try{ const s=localStorage.getItem(LS.form); if(!s) return; const obj=JSON.parse(s); const f=document.getElementById('orderForm'); for(const k in obj){ if(f[k]) f[k].value=obj[k]; } setShipMethod(obj.shipMethod||'HOME'); }catch{} }
loadForm();

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length) return alert('購物車是空的');
  if(!document.getElementById('agree').checked) return alert('請先閱讀並勾選同意');

  const f=new FormData(ev.target);
  const method=getShipMethod();
  const shipText = (method==='HOME')? '宅配' : (method==='PICKUP')? '自取（現金）' : '到門服務（台中≥5箱）';

  if(method==='DOOR' && boxesCount()<5){
    alert('到門服務限台中市且 ≥5 箱（10台斤/箱）'); return;
  }
  if((method==='HOME' || method==='DOOR') && !f.get('addr')){
    alert('請填寫收件地址'); return;
  }

  const payload = {
    ts: new Date().toISOString(),
    name: f.get('name'), phone: f.get('phone'), email: f.get('email'),
    addr: (method==='PICKUP') ? '自取（台中市石岡區石岡街61號）' : (f.get('addr')||''),
    ship: shipText,
    remark: f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(),
    brand: CONFIG.BRAND_TAG,
    shipMeta: { method }
  };

  const payMethod = (document.querySelector('input[name="pay"]:checked')?.value) || 'LINEPAY';
  const btn = el('submitBtn'); const res = el('result');
  btn.disabled=true; btn.textContent='處理中…'; res.textContent='';

  try{
    // 建立訂單（沿用你的 GAS）
    const r = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d = await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');
    const orderNo = d.order_no;

    if(payMethod==='LINEPAY'){
      // 導轉前簡易提示
      res.innerHTML = `<div class="summary" style="background:#ECFDF5;border-color:#D1FAE5">
        <b style="color:#065F46">即將前往 <span class="lp-badge">LINE Pay</span> 完成付款</b>
      </div>`;
      await goLinePay(orderNo, payload);
      return;
    }else{
      // 匯款：顯示帳戶資料
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>
        請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。
        <div class="card" style="padding:10px;margin-top:8px">
          <div><b>${CONFIG.BANK.name}</b></div>
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>
        </div>`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
    }
  }catch(e){
    res.textContent = '送出失敗：'+e.message;
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
  location.href = d.paymentUrl; // 導轉到 LINE Pay
}

/*****************
 * 工具
 *****************/
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window.__t); window.__t=setTimeout(()=> t.classList.remove('show'), 1600);
}

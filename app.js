/*****************
 * 柑心果園 前端整合（覆蓋版）
 *****************/
const CONFIG = {
  BRAND: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  COUPONS: [
    { code: "ORANGE200", type: "flat",   amount: 200,  expire: "2027-12-31" },
    { code: "GANXIN10",  type: "percent", amount: 0.10, expire: "2027-12-31" }
  ],
  IMAGES: {
    BOX: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png",
    HERO: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png",
    LOGO: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png",
    CLOSEUPS: [
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg",
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png",
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg"
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
  // 尺寸（單顆直徑，參考常見台灣分級，僅供前端顯示）
  SIZE_CM: { "23A":"約 8.0–8.5 cm", "25A":"約 7.5–8.0 cm", "27A":"約 7.0–7.5 cm", "30A":"約 6.5–7.0 cm" }
};

// 商品定義
const PRODUCTS = {
  PONGAN: { section:"PONGAN", idPrefix:"PON10", weight:"10台斤", sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { section:"MAOGAO", idPrefix:"MAO10", weight:"10台斤", sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` }
};

// LocalStorage Keys
const LS = { cart:"gx_cart", form:"gx_form", coupon:"gx_coupon", ship:"gx_ship" };

const currency = n => "NT$ " + (Math.round(n)||0).toLocaleString();
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1600); }
function goTo(id){ const el=document.getElementById(id); if(!el) return; const top=(document.querySelector('.chip-nav')?.offsetHeight||0)+50; const y=el.getBoundingClientRect().top + window.scrollY - top; window.scrollTo({top:y,behavior:'smooth'}); }

/* ====== 導引小籤 ====== */
document.querySelectorAll('.chip-nav .chip').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.go)));

/* ====== Story & Closeups Carousels（左右箭頭） ====== */
document.querySelectorAll('.carousel').forEach(car=>{
  const track = car.querySelector('.car-track');
  const prev = car.querySelector('.car-prev');
  const next = car.querySelector('.car-next');
  if(prev) prev.addEventListener('click', ()=>track.scrollBy({left:-track.clientWidth*0.9,behavior:'smooth'}));
  if(next) next.addEventListener('click', ()=>track.scrollBy({left: track.clientWidth*0.9,behavior:'smooth'}));
});

/* ====== 產季時間軸渲染 ====== */
(function renderTimeline(){
  const mon = (m, color, txt) => {
    const el = document.createElement('div'); el.className='mon';
    el.innerHTML = `<div class="orange" style="background:${color}"></div><b>${m}月</b><small>${txt}</small>`;
    return el;
  };
  const rowP = document.getElementById('row-pongan');
  const rowM = document.getElementById('row-maogao');
  // 椪柑 10–4（10,11,12,1,2,3,4）
  const P = [
    {m:10,c:"#6BBF3A",t:"青皮初採"},{m:11,c:"#85C445",t:"高峰期"},{m:12,c:"#F8A531",t:"橙皮始"},
    {m:1,c:"#FFA13A",t:"橙皮穩定"},{m:2,c:"#FF8F21",t:"甜香濃"},{m:3,c:"#FF7A00",t:"尾聲佳"},{m:4,c:"#FFB96E",t:"儲藏柑"}
  ];
  P.forEach(x=>rowP.appendChild(mon(x.m,x.c,x.t)));
  // 茂谷 12–3（12,1,2,3）
  const M = [
    {m:12,c:"#F7A43A",t:"上市"},{m:1,c:"#FF9728",t:"穩定"},{m:2,c:"#FF8613",t:"甜度高"},{m:3,c:"#FF7A00",t:"尾段"}
  ];
  M.forEach(x=>rowM.appendChild(mon(x.m,x.c,x.t)));
})();

/* ====== 規格籤、尺寸、價格、庫存 ====== */
const SELECTED = { PONGAN:"25A", MAOGAO:"25A" };
function priceOf(section,weight,size){ return CONFIG.PRICES[section]?.[weight]?.[size] ?? 0; }

function renderSpecChips(kind){
  const conf = PRODUCTS[kind];
  const rail = document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  // 價格、庫存、尺寸
  const size = SELECTED[kind]; const pid = conf.getId(size);
  const price = priceOf(conf.section, conf.weight, size);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock}`;
  document.getElementById('size-'+kind.toLowerCase()).textContent = CONFIG.SIZE_CM[size] || '—';
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); }
window.addSelected = function(kind){
  const c = PRODUCTS[kind]; const s = SELECTED[kind];
  const pid=c.getId(s); const price=priceOf(c.section,c.weight,s);
  addToCart(pid, (kind==='PONGAN'?'椪柑':'茂谷')+'｜'+c.weight+'｜'+s, price, c.weight, s, c.section);
  showToast('已加入購物車');
};
renderSpecChips('PONGAN'); renderSpecChips('MAOGAO');

/* ====== 浮動抽屜 ====== */
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); if(open) renderCart(); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }
function toggleReviews(open){ document.getElementById('reviewDrawer').classList.toggle('open', !!open); }

/* ====== 購物車 ====== */
const cart = (()=>{ try{ return JSON.parse(localStorage.getItem(LS.cart)||'[]'); }catch{return []} })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }

function addToCart(id,title,price,weight,size,section){
  const existed = cart.find(x=>x.id===id);
  if(existed) existed.qty++;
  else cart.push({ id,title,price,qty:1,weight,size,section });
  saveCart(); renderCart(); // 不自動開抽屜
}

function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }

function calcTotals(){
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const disc = currentDiscount(subtotal);
  const after = Math.max(0, subtotal - disc);
  const shipping = after>=CONFIG.FREE_SHIP_THRESHOLD || cart.length===0 ? 0 : CONFIG.SHIPPING;
  const total = after + shipping;
  return {subtotal, discount:disc, shipping, total};
}
function currentDiscount(subtotal){
  const code = (localStorage.getItem(LS.coupon)||'').trim();
  if(!code) return 0;
  const rule = CONFIG.COUPONS.find(c=>c.code.toUpperCase()===code.toUpperCase());
  if(!rule) return 0;
  if(rule.expire && new Date(rule.expire) < new Date()) return 0;
  if(rule.type==='flat')   return Math.min(subtotal, rule.amount||0);
  if(rule.type==='percent')return Math.round(subtotal * (rule.amount||0));
  return 0;
}
window.applyCoupon = function(){
  const v = (document.getElementById('couponInput').value||'').trim();
  const msg = document.getElementById('couponMsg');
  if(!v){ localStorage.removeItem(LS.coupon); msg.textContent='已清除折扣碼'; renderCart(); return; }
  const rule = CONFIG.COUPONS.find(c=>c.code.toUpperCase()===v.toUpperCase());
  if(!rule){ msg.textContent='無效的折扣碼'; return; }
  if(rule.expire && new Date(rule.expire) < new Date()){ msg.textContent='折扣碼已過期'; return; }
  localStorage.setItem(LS.coupon, rule.code);
  msg.textContent = rule.type==='flat' ? `已套用：折 ${rule.amount} 元` : `已套用：${Math.round(rule.amount*100)}% OFF`;
  renderCart();
};

function renderCart(){
  const list=document.getElementById('cartList');
  if(!list) return;
  if(!cart.length){ list.innerHTML='<div class="note">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>'; }
  else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="row">
        <div>
          <div><b>${c.title}</b></div>
          <div class="note">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div class="qty">
          <button aria-label="減少" onclick="mutateQty(${i},-1)">–</button>
          <span>${c.qty}</span>
          <button aria-label="增加" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>`).join('');
  }
  const {subtotal,discount,shipping,total} = calcTotals();
  document.getElementById('subtotal').textContent = currency(subtotal);
  document.getElementById('discount').textContent = discount? '– ' + currency(discount).replace('NT$ ','NT$ '):'– NT$ 0';
  document.getElementById('shipping').textContent = currency(shipping);
  document.getElementById('total').textContent = currency(total);
}

/* ====== 表單記憶 ====== */
(function restoreForm(){
  const s = localStorage.getItem(LS.form); if(!s) return;
  try{ const v=JSON.parse(s); const f=document.getElementById('orderForm'); if(!f) return;
    for(const k in v){ if(f[k]) f[k].value = v[k]; }
  }catch{}
})();
function saveForm(){ const f=document.getElementById('orderForm'); const obj=Object.fromEntries(new FormData(f)); localStorage.setItem(LS.form, JSON.stringify(obj)); }
document.getElementById('orderForm').addEventListener('input', saveForm);

/* ====== 條款：捲到底才能勾 ====== */
(function policyGate(){
  const det=document.getElementById('policy'); const agree=document.getElementById('agree');
  if(!det) return;
  det.addEventListener('toggle', ()=>{ if(det.open){ const el=det; el.addEventListener('scroll', check, {passive:true}); } });
  function check(){
    const el=det; const c=el.querySelector('summary')?.offsetHeight||0;
    if(el.scrollTop + el.clientHeight >= el.scrollHeight - 4){ agree.disabled=false; el.removeEventListener('scroll',check); }
  }
})();

/* ====== 下單 & LINE Pay ====== */
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀並勾選同意'); return; }

  const f=new FormData(ev.target);
  const payMethod = (document.querySelector('input[name="pay"]:checked')?.value)||'LINEPAY';
  const items = cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty}));
  const payload = {
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr:f.get('addr'), ship:'宅配', remark:f.get('remark')||'',
    items, summary: calcTotals(), brand: CONFIG.BRAND,
    payMethod: payMethod.toLowerCase()==='linepay' ? 'linepay' : 'bank',
    coupon: localStorage.getItem(LS.coupon)||''
  };

  const btn=document.getElementById('submitBtn'); const res=document.getElementById('result');
  btn.disabled=true; btn.textContent='送出訂單中，請稍候…'; res.textContent='';

  try{
    // 主要路徑：新版 doPost 直接支援 linepay
    const r = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d = await r.json();

    if(!d.ok){ throw new Error(d.msg || '建立訂單失敗'); }

    const orderNo = d.order_no;
    if(payMethod==='LINEPAY'){
      const lp = d.linepay || {};
      // 如果回傳含 appUrl，手機優先嘗試（開啟 LINE）
      const tryUrl = (isMobile() && lp.appUrl) ? lp.appUrl : (lp.webUrl || lp.paymentUrl);
      if(!tryUrl) throw new Error('LINE Pay 連結異常');
      localStorage.setItem('gx_lp_orderNo', orderNo);
      // 清空購物車（待回傳頁面會再確認）
      cart.length=0; saveCart(); renderCart();
      location.href = tryUrl;
      return;
    }else{
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
    }

  }catch(e){
    // 後備：舊版 ?action=linepay_request（只在 LINEPAY 才用）
    try{
      const pay = (document.querySelector('input[name="pay"]:checked')?.value)||'LINEPAY';
      if(pay==='LINEPAY'){
        const r2=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_request', { method:'POST', body: JSON.stringify(payload) });
        const d2=await r2.json();
        if(!d2.ok) throw new Error(d2.msg||'LINE Pay 建立交易失敗');
        const orderNo = d2.order_no || localStorage.getItem('gx_lp_orderNo') || '';
        localStorage.setItem('gx_lp_orderNo', orderNo);
        const url = d2.paymentUrl || d2.linepay?.webUrl;
        if(!url) throw new Error('LINE Pay 連結異常');
        cart.length=0; saveCart(); renderCart();
        location.href = url; return;
      }else{
        throw e;
      }
    }catch(err){
      res.textContent = '送出失敗：' + (err.message||String(err));
    }
  }finally{
    btn.disabled=false; btn.textContent='送出訂單';
  }
}
window.submitOrder = submitOrder;

function isMobile(){ return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); }

/* ====== 訂單查詢 ====== */
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target); const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard'); card.style.display='block'; card.textContent='查詢中…';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no));
    const d=await r.json();
    if(!d.ok){ card.textContent='查無此訂單編號'; return; }
    const items=Array.isArray(d.items)? d.items.map(i=>`${i.title} × ${i.qty}`).join('、'):'—';
    card.innerHTML = `
      <div class="row two"><span><b>訂單編號</b></span><span>${d.orderNo}</span></div>
      <div class="row two"><span>狀態</span><span>${d.status||'—'}</span></div>
      <div class="row two"><span>出貨日</span><span>${d.shipDate||'—'}</span></div>
      <div class="row two"><span>物流單號</span><span>${d.trackingNo||'—'}</span></div>
      <div class="row two"><span>金額</span><span>${d.total?currency(d.total):'—'}</span></div>
      <div class="line"></div>
      <div>品項：${items}</div>`;
  }catch(e){ card.textContent='查詢失敗'; }
}
window.queryOrder=queryOrder;

/* ====== 左側好評（100筆，不重複，產季期間日期） ====== */
(function renderReviews(){
  const list = genReviews(100);
  const box = document.getElementById('reviewSlider');
  box.innerHTML = `
    <div class="carousel" style="position:relative">
      <div class="car-track">
        ${list.map(r=>`
          <div class="card" style="min-width:min(90%,520px);scroll-snap-align:center">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <b>${r.name}</b><span class="note">${r.date}</span>
            </div>
            <div class="note" style="margin:6px 0">${r.spec}</div>
            <p style="margin:6px 0 0">${r.text}</p>
            <div style="margin-top:8px">
              <button class="btn white">${r.stars>=5?'買過都說讚':'覺得不錯'}</button>
            </div>
          </div>`).join('')}
      </div>
      <button class="car-prev">‹</button>
      <button class="car-next">›</button>
    </div>`;
  const car = box.querySelector('.carousel'), track=car.querySelector('.car-track');
  car.querySelector('.car-prev').onclick=()=>track.scrollBy({left:-track.clientWidth*0.9,behavior:'smooth'});
  car.querySelector('.car-next').onclick=()=>track.scrollBy({left: track.clientWidth*0.9,behavior:'smooth'});
})();
function maskName(name){ const s=String(name||'').trim(); if(s.length<=2) return s[0]+'○'; return s[0]+'○'.repeat(s.length-2)+s[s.length-1]; }
function seasonalDate(){
  const now=new Date(); const y=now.getFullYear(); // 產季（椪柑 10–4；茂谷 12–3）
  const start=new Date((now.getMonth()+1)>=10 ? y : y-1, 9, 1).getTime(); // 10/1
  const end  =new Date(y+1, 3, 30).getTime(); // 次年 4/30
  const t = start + Math.random()*(Math.min(end,Date.now())-start);
  const d=new Date(t); const mm=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function genReviews(n=100){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","熒","容","翔","修","均","凱"]; 
  const sizes=["23A","25A","27A","30A"]; const arr=[];
  const good=["沒吃過這麼甜的椪柑","果香乾淨、連皮都香","顆顆飽滿，小孩搶著吃","冰過更好吃","甜度穩定，回購了","價格實在，品質很好","家人都說這批很讚","送禮有面子"];
  const ok=["甜中帶酸很開胃","皮薄好剝很舒服","香氣清新","多汁不易噎"];
  for(let i=0;i<n;i++){
    const name=maskName(last[Math.floor(Math.random()*last.length)]+given[Math.floor(Math.random()*given.length)]+given[Math.floor(Math.random()*given.length)]);
    const star = (i%50===0 || i%37===0) ? 3 : (Math.random()<0.2?4:5);
    const text = star===3 ? ok[Math.floor(Math.random()*ok.length)] : good[Math.floor(Math.random()*good.length)];
    const spec=`10台斤｜${sizes[Math.floor(Math.random()*sizes.length)]}`;
    arr.push({name, date:seasonalDate(), spec, text, stars:star});
  }
  return arr;
}

/* ====== 初始化：圖片、事件 ====== */
(function init(){
  // 產品圖片（確保 1:1 置中）
  document.getElementById('img-pongan').src = CONFIG.IMAGES.BOX;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.BOX;

  // 浮動按鈕防手機放大跳動
  document.querySelectorAll('input,select,textarea').forEach(el=>el.setAttribute('inputmode','text'));
})();

/* ====== 事件：Fab ====== */
document.getElementById('cartFab').addEventListener('click', ()=>toggleCart(true));
document.getElementById('queryFab').addEventListener('click', ()=>toggleQuery(true));
document.getElementById('reviewFab').addEventListener('click', ()=>toggleReviews(true));
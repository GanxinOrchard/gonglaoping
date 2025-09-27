/* ====== 基本設定 ====== */
const CONFIG = {
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  FREE_SHIP: 1800,
  SHIPPING: 160,
  CURRENCY: "TWD",
  IMAGES:{
    HERO:"https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png",
    LOGO:"https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png",
    BOX:"https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png",
    CLOSEUPS:[
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg",
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png",
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg"
    ]
  },
  // 價格表
  PRICES:{
    PONGAN:{"10台斤":{"23A":750,"25A":780,"27A":820,"30A":880}},
    MAOGAO:{"10台斤":{"23A":720,"25A":760,"27A":800,"30A":860}}
  },
  // 庫存/銷售（示例）
  INV:{
    "PON10-23A":{sold:50,stock:200}, "PON10-25A":{sold:122,stock:678}, "PON10-27A":{sold:66,stock:734}, "PON10-30A":{sold:55,stock:745},
    "MAO10-23A":{sold:72,stock:178}, "MAO10-25A":{sold:355,stock:545}, "MAO10-27A":{sold:102,stock:698}, "MAO10-30A":{sold:78,stock:722}
  },
  // 量表（0–100%）
  METER:{
    PONGAN:{ sweet:80, acid:40, aroma:60 },
    MAOGAO:{ sweet:90, acid:50, aroma:80 }
  },
  // 規格 → 單顆直徑（約）
  SIZE_CM:{
    "23A":"約 8.0–8.8 cm",
    "25A":"約 7.5–8.2 cm",
    "27A":"約 7.0–7.6 cm",
    "30A":"約 6.2–7.0 cm"
  },
  // 折扣碼（可設到期日）
  COUPONS:[
    {code:"SAVE200", type:"flat", value:200, expire:"2099-12-31"},
    {code:"ORANGE10", type:"percent", value:10, expire:"2099-12-31"}
  ]
};
const SELECTED = { PONGAN:"25A", MAOGAO:"25A" };
const LS = { cart:"gx_cart", form:"gx_form", coupon:"gx_coupon" };

const currency = n => "NT$ "+(Number(n)||0).toLocaleString();

/* ====== 導覽、輪播 ====== */
function slider(btnPrev, btnNext, trackEl){
  const prev = document.querySelector(btnPrev);
  const next = document.querySelector(btnNext);
  const track= document.querySelector(trackEl);
  if(!track) return;
  prev?.addEventListener('click',()=> track.scrollBy({left:-track.clientWidth*0.9, behavior:"smooth"}));
  next?.addEventListener('click',()=> track.scrollBy({left: track.clientWidth*0.9, behavior:"smooth"}));
}
slider('.story-slider .prev','.story-slider .next','.story-track');
slider('.closeup-slider .prev','.closeup-slider .next','.closeup-track');

/* ====== 產季時間軸 ====== */
function buildMonths(rowId, activeMonths){
  const host = document.getElementById(rowId);
  if(!host) return;
  const labels = ["10","11","12","01","02","03","04","05","06","07","08","09"];
  host.innerHTML = labels.map((m,i)=>{
    const act = activeMonths.includes(m);
    // 椪柑：10~12 綠轉橘；12~04 橘
    const dotClass = act ? (["10","11"].includes(m) ? "green":"orange") : "gray";
    const text = m+"月";
    const tip = act ? (m==="10"?"青皮起採":"風味穩定") : "非產季";
    return `<div class="month">
      <div class="dot ${dotClass}"></div>
      <small>${text}</small>
      <small class="note">${tip}</small>
    </div>`;
  }).join("");
}
buildMonths("months-pongan",["10","11","12","01","02","03","04"]);
buildMonths("months-maogao",["12","01","02","03"]);

/* ====== 商品＆選購合併 ====== */
function priceOf(kind, size){ return CONFIG.PRICES[kind]["10台斤"][size]||0; }
function invOf(key){ return CONFIG.INV[key]||{sold:0,stock:0}; }

function renderProduct(kind){
  const idPrefix = (kind==="PONGAN"?"PON10":"MAO10");
  const priceEl = document.getElementById("price-"+kind.toLowerCase());
  const invEl   = document.getElementById("inv-"+kind.toLowerCase());
  const specRail= document.getElementById("spec-"+kind.toLowerCase());
  const sizeChip= document.getElementById("size-"+kind.toLowerCase());

  const sizes = ["23A","25A","27A","30A"];
  specRail.innerHTML = sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?"active":""}" onclick="selectSpec('${kind}','${s}')">${s}</button>`).join("");
  const pid = idPrefix+"-"+SELECTED[kind];
  priceEl.textContent = currency(priceOf(kind, SELECTED[kind]));
  const inv = invOf(pid);
  invEl.textContent = `已售 ${inv.sold}｜剩 ${inv.stock}`;

  sizeChip.textContent = `直徑 ${CONFIG.SIZE_CM[SELECTED[kind]]||"—"}`;

  // 長條量表
  const meter = CONFIG.METER[kind];
  document.getElementById("sweet-"+kind.toLowerCase()).style.width = meter.sweet+"%";
  document.getElementById("acid-"+kind.toLowerCase()).style.width  = meter.acid+"%";
  document.getElementById("aroma-"+kind.toLowerCase()).style.width = meter.aroma+"%";
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderProduct(kind); }

renderProduct("PONGAN");
renderProduct("MAOGAO");

/* ====== 購物車 ====== */
const cart = (()=>{ try{ return JSON.parse(localStorage.getItem(LS.cart)||"[]"); }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function addSelected(kind){
  const size = SELECTED[kind];
  const id   = (kind==="PONGAN"?"PON10":"MAO10")+"-"+size;
  const price= priceOf(kind,size);
  const title= (kind==="PONGAN"?"椪柑":"茂谷")+"｜10台斤｜"+size;
  const existed = cart.find(x=>x.id===id);
  if(existed) existed.qty++;
  else cart.push({id,title,section:kind,weight:"10台斤",size,price,qty:1});
  saveCart(); renderCart(); bumpFab();
  // 按你需求：加入不自動打開購物車，只提示
  toast("已加入購物車");
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm("確定清空購物車？")){ cart.length=0; saveCart(); renderCart(); } }

function calcTotals(){
  const subtotal = cart.reduce((s,i)=> s + i.price*i.qty, 0);
  const applied = applyCouponCalc(subtotal);
  const shipping = (applied.total>=CONFIG.FREE_SHIP || cart.length===0)? 0 : CONFIG.SHIPPING;
  return { subtotal, discount:applied.discount, shipping, total: applied.total + shipping, code: applied.code, msg: applied.msg };
}
function renderCart(){
  const list=document.getElementById('cartList');
  if(!list) return;
  if(!cart.length){ list.innerHTML = `<div class="note">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>`; }
  else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="cart-row">
        <div>
          <div><b>${c.title}</b></div>
          <div class="note">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div class="qty">
          <button aria-label="減少" onclick="mutateQty(${i},-1)">–</button>
          <div style="width:36px;text-align:center">${c.qty}</div>
          <button aria-label="增加" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>`).join("");
  }
  const {subtotal,discount,shipping,total,code,msg} = calcTotals();
  qs('#subtotal').textContent = currency(subtotal);
  qs('#shipping').textContent = currency(shipping);
  qs('#total').textContent    = currency(total);
  if(code||msg){ qs('#couponMsg').textContent = msg || `已套用折扣碼：${code}`; } else qs('#couponMsg').textContent="";
  // 表單欄位記憶
  loadForm();
}
function toggleCart(open){
  const el = document.getElementById('cartDrawer');
  el.classList.toggle('show', !!open);
  // 鎖捲動（行動裝置）
  if(el.classList.contains('show')) lockBody(); else unlockBody();
}
document.getElementById('cartFab')?.addEventListener('click',()=>toggleCart(true));
document.querySelector('[data-cart-close]')?.addEventListener('click',()=>toggleCart(false));

/* ====== 折扣碼 ====== */
function validCoupon(code){
  const c = CONFIG.COUPONS.find(x=>x.code.toLowerCase()===String(code||'').trim().toLowerCase());
  if(!c) return null;
  if(c.expire && new Date(c.expire) < new Date()) return { expired:true, ...c };
  return c;
}
function applyCoupon(){
  const input = qs('#coupon').value.trim();
  if(!input){ qs('#couponMsg').textContent='請輸入折扣碼'; return; }
  const c = validCoupon(input);
  if(!c){ qs('#couponMsg').textContent='折扣碼無效'; saveCoupon(''); renderCart(); return; }
  if(c.expired){ qs('#couponMsg').textContent='折扣碼已過期'; saveCoupon(''); renderCart(); return; }
  saveCoupon(c.code);
  qs('#couponMsg').textContent='已套用折扣碼：'+c.code;
  renderCart();
}
function applyCouponCalc(subtotal){
  const code = loadCoupon();
  if(!code) return { total:subtotal, discount:0, code:null };
  const c = validCoupon(code);
  if(!c || c.expired) return { total:subtotal, discount:0, code:null, msg: c && c.expired ? '折扣碼已過期' : '' };
  let discount = 0;
  if(c.type==='flat') discount = Math.min(subtotal, c.value);
  else if(c.type==='percent') discount = Math.floor(subtotal * (c.value/100));
  return { total: Math.max(0, subtotal - discount), discount, code:c.code };
}
function saveCoupon(code){ localStorage.setItem(LS.coupon, code||''); }
function loadCoupon(){ return localStorage.getItem(LS.coupon)||''; }

/* ====== 表單記憶 ====== */
function saveForm(){
  const f=qs('#orderForm'); if(!f) return;
  const obj={}; ['name','phone','email','addr','remark'].forEach(k=> obj[k]=f[k]?.value||'');
  localStorage.setItem(LS.form, JSON.stringify(obj));
}
function loadForm(){
  const f=qs('#orderForm'); if(!f) return;
  try{
    const obj=JSON.parse(localStorage.getItem(LS.form)||'{}');
    ['name','phone','email','addr','remark'].forEach(k=>{ if(f[k] && obj[k]) f[k].value=obj[k]; });
  }catch{}
}
document.addEventListener('input', e=>{
  if(e.target.closest('#orderForm')) saveForm();
});

/* ====== 提交訂單 ====== */
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree = document.getElementById('agree');
  if(!agree.checked){ alert('請先閱讀說明並勾選同意'); return; }

  const f=new FormData(ev.target);
  const payMethod = (f.get('pay')==='LINEPAY') ? 'LINEPAY' : 'BANK';
  const payload = {
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr:f.get('addr'), ship:'宅配', remark:f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calcTotals(), brand:'柑心果園', payMethod: payMethod.toLowerCase()
  };

  const btn=qs('#submitBtn'); const res=qs('#result');
  btn.disabled=true; btn.textContent='送出訂單中，請稍候…'; res.textContent='';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT, {method:'POST', body: JSON.stringify(payload)});
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');

    if(payMethod==='LINEPAY' && d.linepay){
      // 導向 LINE Pay（行動優先 appUrl，失敗回 webUrl）
      const info = d.linepay;
      goLinePay(d.order_no, { linepay: info });
      return;
    }else{
      res.innerHTML = `✅ 訂單已建立（<b>${d.order_no}</b>），我們會盡快安排出貨。`;
      cart.length=0; saveCart(); renderCart(); saveForm();
    }
  }catch(e){
    res.textContent='送出失敗：'+e.message;
  }finally{
    btn.disabled=false; btn.textContent='送出訂單';
  }
}

/* ====== 訂單查詢 ====== */
function toggleQuery(open){ qs('#queryDrawer').classList.toggle('show', !!open); if(open) lockBody(); else unlockBody(); }
document.getElementById('queryFab')?.addEventListener('click',()=>toggleQuery(true));
async function queryOrder(ev){
  ev.preventDefault();
  const no = new FormData(ev.target).get('orderNo').trim();
  const card = qs('#queryCard'); card.style.display='block'; card.textContent='查詢中…';
  try{
    const r = await fetch(`${CONFIG.GAS_ENDPOINT}?orderNo=${encodeURIComponent(no)}`);
    const d = await r.json();
    if(!d.ok) throw new Error(d.msg||'查無此訂單編號');
    const items = (d.items||[]).map(i=>`${i.title} × ${i.qty}`).join('、');
    card.innerHTML = `
      <div><b>訂單編號：</b>${d.orderNo}</div>
      <div><b>狀態：</b>${d.shipStatus||'—'}</div>
      <div><b>出貨日：</b>${d.shipDate||'—'}</div>
      <div><b>物流單號：</b>${d.trackingNo||'—'}</div>
      <div><b>金額：</b>${d.total?currency(d.total):'—'}</div>
      <div><b>品項：</b>${items||'—'}</div>`;
  }catch(e){ card.textContent='查詢失敗：'+e.message; }
}

/* ====== 買過都說讚（100 則，不重複） ====== */
function maskName(name){ const s=name; if(s.length<=2) return s[0]+'○'; return s[0]+'○'.repeat(s.length-2)+s.at(-1); }
function seasonalDates(n){
  const now=new Date(); const y=now.getMonth()+1>=11?now.getFullYear():now.getFullYear()-1;
  const start=new Date(`${y}-11-01`).getTime(), end=new Date(`${y+1}-03-31`).getTime();
  const arr=[]; for(let i=0;i<n;i++){ const t=start+Math.random()*(end-start); const d=new Date(t);
    arr.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  } return arr.sort((a,b)=> a<b?1:-1);
}
function genReviews(){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","熒","容","翔","修","均","凱"];
  const txts=[
    "沒吃過這麼好吃的椪柑","果香乾淨，剝皮就香","冰過更讚！孩子瘋狂愛","箱箱品質穩定不踩雷","價格實在，新鮮直送","細嫩多汁，吃完會想念",
    "今年這批特別好","回購第三次了","送禮有面子","酸甜剛好超涮嘴","果皮好剝又不黏手","汁水多但不亂滴","家人說比外面買好吃太多",
    "吃了會上癮","風味很乾淨","甜度剛剛好","色澤很漂亮","物流快，完好無損","老欉有靈魂","清爽不膩口","長輩很喜歡","孩子也愛吃","果香天然不做作",
    "箱內規格一致","有批次可追溯很安心","客服親切","理賠清楚，放心買","現採直送太新鮮了","回購名單NO.1"
  ];
  const dates = seasonalDates(100);
  const arr=[]; let three=0;
  for(let i=0;i<100;i++){
    let star=5; if(three<2 && i%33===0){ star=3; three++; } else if(i%10===0){ star=4; }
    const name=maskName(last[Math.floor(Math.random()*last.length)]+given[Math.floor(Math.random()*given.length)]+given[Math.floor(Math.random()*given.length)]);
    const spec=["23A","25A","27A","30A"][Math.floor(Math.random()*4)];
    const text = txts[(i*7)%txts.length];
    arr.push({date:dates[i], name, spec, star, text});
  }
  return arr;
}
function renderReviews(){
  const list=genReviews();
  const track=qs('#rvTrack');
  track.innerHTML = list.map(r=>`
    <div class="rv-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b>${r.name}</b><span class="note">${r.date}</span>
      </div>
      <div class="note">規格：${r.spec}｜評分：${r.star} / 5</div>
      <div>${r.text}</div>
    </div>`).join("");
}
renderReviews();
function toggleReviews(open){ qs('#rvDrawer').classList.toggle('show', !!open); if(open) lockBody(); else unlockBody(); }
document.getElementById('rvFab')?.addEventListener('click',()=>toggleReviews(true));

/* ====== policy 捲底才可勾同意 ====== */
(function(){
  const box=qs('#policy'); const agree=qs('#agree');
  if(!box||!agree) return;
  const body=box.querySelector('.policy-body');
  body.addEventListener('scroll', ()=>{
    if(body.scrollTop + body.clientHeight >= body.scrollHeight - 4){ agree.disabled=false; }
  });
})();

/* ====== 工具 ====== */
function qs(s){ return document.querySelector(s); }
function toast(msg){
  let t = document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast';
    t.style.cssText='position:fixed;right:16px;bottom:80px;background:#111;color:#fff;padding:10px 14px;border-radius:10px;opacity:0;transition:.25s;z-index:120';
    document.body.appendChild(t);
  }
  t.textContent=msg; t.style.opacity='1'; setTimeout(()=>t.style.opacity='0',1500);
}

/* ====== 行動：購物車全螢幕 + 背景鎖捲（含 LINE Pay 導轉保底） ====== */
let scrollY=0;
function lockBody(){ scrollY=window.scrollY||0; document.body.classList.add('modal-open'); document.body.style.top=`-${scrollY}px`; }
function unlockBody(){ document.body.classList.remove('modal-open'); const y=scrollY; document.body.style.top=''; window.scrollTo(0,y); }
function goLinePay(orderNo, payload){
  try{
    const info = payload && payload.linepay ? payload.linepay : null;
    if(!info) throw new Error('找不到付款網址');
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|line\//.test(ua);
    if(isMobile && info.appUrl){
      const t0=Date.now(); location.href=info.appUrl;
      setTimeout(()=>{ if(Date.now()-t0<1400 && info.webUrl){ location.href=info.webUrl; } },1200);
    }else{
      location.href = info.webUrl || info.appUrl;
    }
  }catch(e){ alert('LINE Pay 開啟失敗：'+e.message); }
}

/* ====== 初始 ====== */
function init(){
  renderCart();
  // 浮動按鈕：購物車開關
  document.querySelectorAll('[data-cart-open]').forEach(btn=>btn.addEventListener('click',()=>toggleCart(true)));
  document.querySelectorAll('[data-cart-close]').forEach(btn=>btn.addEventListener('click',()=>toggleCart(false)));
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
/***********************
 * 柑心果園 - 前端腳本 *
 ***********************/
const CONFIG = {
  BRAND: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160,
  FREE_SHIP: 1800,
  IMAGES: {
    HERO: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png",
    BOX:  "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png",
    LOGO: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png",
    CLOSEUPS: [
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg",
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png",
      "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"
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
  DIAMETER_CM: {
    "23A":"約 7.3–7.5 cm", "25A":"約 7.6–7.8 cm", "27A":"約 7.9–8.1 cm", "30A":"約 8.2–8.5 cm"
  },
  // 折扣碼（可設定到期）
  COUPONS: [
    { code:"GXO-200",   type:"fixed", value:200,  expires:"2026-12-31" },
    { code:"GXO-90OFF", type:"rate",  value:0.9,  expires:"2026-12-31" }
  ]
};

// 產品定義
const PRODUCTS = {
  PONGAN:{ idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`PON10-${s}` },
  MAOGAO:{ idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`MAO10-${s}` }
};
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };

// 本地儲存鍵
const LS = { cart:'gx_cart', form:'gx_form', coupon:'gx_coupon' };

// 工具
const currency = n => "NT$ "+(n||0).toLocaleString();
const isMobile = ()=> /iPhone|Android|iPad/i.test(navigator.userAgent);

function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }

// === 導覽＆輪播 ===
function initCarousels(){
  document.querySelectorAll('.carousel').forEach(car=>{
    const track = car.querySelector('.car-track');
    const slides = [...track.children];
    let idx = 0, timer = null;
    const go = (i)=>{ idx=(i+slides.length)%slides.length; track.style.transform=`translateX(-${idx*100}%)`; };
    car.querySelector('.prev')?.addEventListener('click',()=>go(idx-1));
    car.querySelector('.next')?.addEventListener('click',()=>go(idx+1));
    slides.forEach(s=> s.style.flex = '0 0 100%');
    const ap = Number(car.dataset.autoplay||0);
    if(ap>0){ timer=setInterval(()=>go(idx+1), ap); car.addEventListener('mouseenter',()=>clearInterval(timer)); car.addEventListener('mouseleave',()=>timer=setInterval(()=>go(idx+1), ap)); }
    go(0);
  });
}

// === 產季時間軸 ===
function renderTimeline(){
  const tie = (wrap, months, fillRange)=>{
    wrap.innerHTML = months.map((m,i)=>{
      const fill = fillRange.includes(i);
      const label = ["10月","11月","12月","1月","2月","3月","4月"][i]||"";
      const desc = ["青皮初熟","高峰","轉橙","穩定","甜香","尾聲","儲藏"][i]||"";
      return `<div class="dot"><div class="orange ${fill?'fill':''}"></div><small>${label}<br>${desc}</small></div>`;
    }).join('');
  };
  tie(document.getElementById('line-pongan'), [0,1,2,3,4,5,6], [0,1,2,3,4,5,6]); // 10-4
  tie(document.getElementById('line-maogao'), [0,1,2,3,4,5,6], [2,3,4,5]);       // 12-3
}

// === 規格籤＆量表＆尺寸 ===
function priceOf(section,weight,size){ return CONFIG.PRICES[section]?.[weight]?.[size] ?? 0; }
function renderSpecChips(kind){
  const conf=PRODUCTS[kind]; const rail=document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${s}</button>`).join('');
  // 價格
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  // 庫存
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售 ${inv.sold}｜剩 ${inv.stock}`;
  // 尺寸
  const sizeStr = CONFIG.DIAMETER_CM[SELECTED[kind]] || '—';
  document.getElementById((kind==='PONGAN'?'size-pongan':'size-maogao')).textContent = sizeStr;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); updateBars(kind); }
function updateBars(kind){
  // 以固定甜酸香數據，不同規格不變（若要依規格微調可延伸）
  if(kind==='PONGAN'){ setBar('p',80,40,60); }
  else{ setBar('m',90,50,80); }
}
function setBar(prefix,sweet,acid,aroma){
  document.getElementById(`bar-${prefix}-sweet`).style.width = sweet+'%';
  document.getElementById(`bar-${prefix}-acid`).style.width  = acid+'%';
  document.getElementById(`bar-${prefix}-aroma`).style.width = aroma+'%';
}

// === 購物車 ===
const cart = (()=>{ try{ return JSON.parse(localStorage.getItem(LS.cart)||'[]'); }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function addToCart(pid,title,price,weight,size,section){
  const existed = cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({ id:pid, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); bumpFab(); showToast('已加入預購清單');
}
function addSelected(kind){
  const c=PRODUCTS[kind], s=SELECTED[kind], pid=c.getId(s), price=priceOf(c.section,c.weight,s);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${c.weight}｜${s}`;
  addToCart(pid,title,price,c.weight,s,c.section);
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }
function toggleReviews(open){ document.getElementById('reviewsDrawer').classList.toggle('open', !!open); }

function calc(){
  let subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  let discount = calcCoupon(subtotal);
  let shipping = (subtotal-discount)>=CONFIG.FREE_SHIP || cart.length===0 ? 0 : CONFIG.SHIPPING;
  return {subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
}

function calcCoupon(subtotal){
  const code = (localStorage.getItem(LS.coupon)||'').trim();
  if(!code) return 0;
  const now = new Date().toISOString().slice(0,10);
  const hit = CONFIG.COUPONS.find(c=>c.code.toUpperCase()===code.toUpperCase() && (!c.expires || now<=c.expires));
  if(!hit) return 0;
  if(hit.type==='fixed') return Math.min(hit.value, subtotal);
  if(hit.type==='rate')  return Math.round(subtotal*(1-hit.value));
  return 0;
}
function applyCoupon(){
  const code = (document.getElementById('coupon').value||'').trim();
  const now = new Date().toISOString().slice(0,10);
  const hit = CONFIG.COUPONS.find(c=>c.code.toUpperCase()===code.toUpperCase());
  const msg = document.getElementById('couponMsg');
  if(!hit){ msg.textContent='折扣碼無效'; localStorage.removeItem(LS.coupon); renderCart(); return; }
  if(hit.expires && now>hit.expires){ msg.textContent='折扣碼已過期'; localStorage.removeItem(LS.coupon); renderCart(); return; }
  localStorage.setItem(LS.coupon, hit.code);
  msg.textContent = hit.type==='fixed' ? `已套用：折抵 NT$${hit.value}` : `已套用：${Math.round(hit.value*100)} 折`;
  renderCart();
}

function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){ list.innerHTML='<div class="muted center">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>'; }
  else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="row2" style="margin:8px 0">
        <div>
          <div><b>${c.title}</b></div>
          <div class="muted">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div>
          <button class="btn-ghost" onclick="mutateQty(${i},-1)">–</button>
          <button class="btn-ghost" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>`).join('');
  }
  const {subtotal,discount,shipping,total}=calc();
  document.getElementById('subtotal').textContent=currency(subtotal);
  document.getElementById('shipping').textContent=currency(shipping);
  document.getElementById('total').textContent=currency(total);
  document.getElementById('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
}

function saveForm(){ 
  const f=document.getElementById('orderForm'); 
  const obj=Object.fromEntries(new FormData(f)); 
  localStorage.setItem(LS.form, JSON.stringify(obj)); 
}
function loadForm(){
  try{
    const s=localStorage.getItem(LS.form); if(!s) return;
    const obj=JSON.parse(s); const f=document.getElementById('orderForm');
    for(const k in obj){ if(f[k]) f[k].value=obj[k]; }
  }catch{}
}

/*** 送單 ***/
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }

  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀「物流與退貨說明」並勾選同意'); return; }

  const f=new FormData(ev.target);
  const payMethod = (f.get('pay')||'LINEPAY');
  const btn=document.getElementById('submitBtn');
  const resBox=document.getElementById('result');
  btn.disabled=true; btn.textContent='送出訂單中，請稍候…'; resBox.textContent='';

  try{
    const {subtotal,discount,shipping,total}=calc();
    const payload={
      ts:new Date().toISOString(),
      name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
      addr:f.get('addr'), ship:'宅配', remark:f.get('remark')||'',
      items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
      summary: {subtotal, discount, shipping, total},
      brand: CONFIG.BRAND, payMethod: payMethod.toLowerCase()
    };

    // 呼叫 GAS
    const r=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');

    const orderNo=d.order_no;

    if(payMethod==='LINEPAY'){
      const lp = d.linepay || {};
      const url = isMobile() ? (lp.appUrl||lp.webUrl) : lp.webUrl;
      if(!url) throw new Error('LINE Pay 連線失敗，請改用匯款或稍後再試。');
      // 不清除購物車，待回來後再確認；這是避免失敗導致遺失
      location.href = url;
      return;
    }else{
      // 匯款：顯示銀行資訊（GAS 也會寄信）
      resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
    }
  }catch(e){
    resBox.textContent='送出失敗：'+e.message;
  }finally{
    btn.disabled=false; btn.textContent='送出訂單';
  }
}

/*** 訂單查詢 ***/
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target); const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard'); card.style.display='block'; card.innerHTML='查詢中…';
  try{
    const url=CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no);
    const r=await fetch(url); const data=await r.json();
    if(data.ok){
      const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—';
      const shipDate=data.shipDate?dateOnly(data.shipDate):'—';
      const trackNo=data.trackingNo||'—';
      const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—';
      card.innerHTML=`<div class="row2"><h3 style="margin:0">訂單 ${no}</h3><span class="muted">${new Date().toLocaleString()}</span></div>
      <div class="line"></div>
      <div><b>狀態：</b>${data.shipStatus||'—'}</div>
      <div><b>出貨日：</b>${shipDate}</div>
      <div><b>物流單號：</b>${trackNo}</div>
      <div><b>金額：</b>${total}</div>
      <div><b>品項：</b>${items}</div>`;
    }else{
      card.innerHTML='查無此訂單編號';
    }
  }catch(e){ card.innerHTML='查詢失敗：'+e.message; }
}

/*** 評論（100 則、季節範圍、內容不重複） ***/
function genReviews(n=100){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍顧龔柯殷唐程金石".split("");
  const given="家怡庭志雅柏鈞恩安宥沛玟杰宗祺郁妤柔軒瑜嘉卉熒容翔修均凱瀚勛榕彤瑄妤萱睿萱淳語".split("");
  const sayings=[
    "沒吃過這麼清爽的甜度","顆顆飽滿，家人一直拿","好剝不沾手，小孩超愛",
    "香氣乾淨不膩口","收到兩天就吃光","細嫩爆汁，真的好吃",
    "價格實在，品質穩定","冰過更好吃","回購第三年了","今年這批特別好"
  ];
  const mmRange=[10,11,12,1,2,3,4]; // 產季月份
  const year=new Date().getMonth()+1>=8? new Date().getFullYear(): new Date().getFullYear()-1;
  function randomDate(){ const m=mmRange[Math.floor(Math.random()*mmRange.length)]; const y = (m>=8?year:year+1); const d = 1+Math.floor(Math.random()*26); return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  let arr=[];
  for(let i=0;i<n;i++){
    const name = last[i%last.length]+given[(i*7)%given.length];
    let stars = 5; if(i%47===0 || i%53===0) stars=3; // 2 則 3星
    const text = sayings[(i*13)%sayings.length];
    const spec = ["23A","25A","27A","30A"][(i*5)%4];
    arr.push({name, date:randomDate(), stars, text, spec});
  }
  arr.sort((a,b)=> a.date<b.date?1:-1);
  return arr;
}
function renderReviews(){
  const track=document.getElementById('reviewsTrack'); const list=genReviews(100);
  track.innerHTML = list.map(r=>`
    <div class="review-card">
      <div class="review-head">🍊 ${r.name}</div>
      <div class="review-meta">日期：${r.date}｜購買：10台斤・${r.spec}｜評分：${r.stars} / 5</div>
      <p style="margin:.35rem 0 0">${r.text}</p>
    </div>`).join('');
}

/*** 互動：政策需捲到底才可勾選 ***/
function enableAgreeWhenScrolled(){
  const policy=document.getElementById('policy');
  policy?.addEventListener('scroll',()=>{
    const el=policy; if(el.scrollTop+el.clientHeight>=el.scrollHeight-10) document.getElementById('agree').disabled=false;
  });
}

/*** 初始 ***/
document.addEventListener('DOMContentLoaded', ()=>{
  // Hero 圖
  document.getElementById('hero').style.backgroundImage = `url('${CONFIG.IMAGES.HERO}')`;

  // 規格與量表
  renderSpecChips('PONGAN'); updateBars('PONGAN');
  renderSpecChips('MAOGAO'); updateBars('MAOGAO');

  // 圖片（產品箱子）
  document.getElementById('img-pongan').src = CONFIG.IMAGES.BOX;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.BOX;

  // 輪播/時間軸
  initCarousels(); renderTimeline();

  // 購物車初始
  renderCart(); loadForm(); enableAgreeWhenScrolled();

  // 浮動按鈕
  document.getElementById('cartFab').onclick = ()=>toggleCart(true);
  document.getElementById('queryFab').onclick = ()=>toggleQuery(true);
  document.getElementById('reviewsFab').onclick = ()=>toggleReviews(true);

  // 表單記憶
  document.getElementById('orderForm')?.addEventListener('input', saveForm, {passive:true});
});
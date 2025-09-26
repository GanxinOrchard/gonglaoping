/***************
 * 基礎設定   *
 ***************/
const CONFIG = {
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    CLOSEUPS: [
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D2.jpg"),
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D3.jpg"),
      toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9E%9C%E5%AF%A6%E9%80%B2%E6%8B%8D1.jpg") // 你指定的第三張
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
  DIAMETER_CM: { "23A":"約 8.0–8.5 cm", "25A":"約 7.5–8.0 cm", "27A":"約 7.0–7.5 cm", "30A":"約 6.5–7.0 cm" }
};
const LS = { cart:'gx_cart', form:'gx_form', sel:'gx_sel' };

/***************
 * 小工具     *
 ***************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();

/***************
 * 導覽與 Hero *
 ***************/
document.getElementById('heroImg').src = CONFIG.IMAGES.HERO;
document.getElementById('hamburger').addEventListener('click', ()=>document.getElementById('mainNav').classList.toggle('show'));

/***************
 * 品牌故事輪播 *
 ***************/
const STORY = [
  { title:"我們把速度，還給成熟；把分數，交給味道。",
    body:"不追風口，只追成熟度。少一分躁、少一分多餘的投入；順著節氣，順著樹勢。我們相信：真正的高端，不是華麗辭藻，而是你不需要挑、每一顆都能放心給家人吃。當你說「今年這批特別好」，那就是我們與土地的對稿通過了。" },
  { title:"一顆橘子，承載的是家族把山當家的方法。",
    body:"公老坪的椪柑傳承好幾代；東勢的茂谷，也走過半世紀的風土學。修枝、疏果、等待，是祖輩留下的節奏；該收就收、該捨就捨，是我們的膽識。上架前都要經過看色、捏彈、聞油胞三道手感檢查，因為祖父只教一句：手要比秤更準。" },
  { title:"山的節奏，做橘子的事。", body:"高地日照，老欉分級，現採直送。簡單，卻是我們每天的全力以赴。" }
];
(function renderStory(){
  const el = document.getElementById('storyCarousel');
  const dots = document.getElementById('storyDots');
  const slides = STORY.map((s,i)=>`
    <article class="story-slide ${i===0?'on':''}">
      <div class="story-inner">
        <h3>${s.title}</h3>
        <p>${s.body}</p>
      </div>
    </article>`).join('');
  el.insertAdjacentHTML('afterbegin', `<div class="story-track">${slides}</div>`);
  dots.innerHTML = STORY.map((_,i)=>`<button class="dot ${i===0?'on':''}" data-i="${i}"></button>`).join('');
  let idx=0; const n=STORY.length;
  function go(i){ idx=(i+n)%n;
    el.querySelectorAll('.story-slide').forEach((s,j)=>s.classList.toggle('on', j===idx));
    dots.querySelectorAll('.dot').forEach((d,j)=>d.classList.toggle('on', j===idx));
  }
  el.querySelector('.prev').onclick=()=>go(idx-1);
  el.querySelector('.next').onclick=()=>go(idx+1);
  dots.querySelectorAll('.dot').forEach(d=>d.onclick=()=>go(+d.dataset.i));
  setInterval(()=>go(idx+1), 5200);
})();

/***************
 * 信任點滑入   *
 ***************/
const io = new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target);} }),{threshold:.2});
document.querySelectorAll('.reveal').forEach(x=>io.observe(x));

/***************
 * 果實近拍     *
 ***************/
(function renderCloseups(){
  const track = document.getElementById('closeupTrack');
  const dots = document.getElementById('closeupDots');
  track.innerHTML = CONFIG.IMAGES.CLOSEUPS.map(src=>`<img src="${src}" alt="果實近拍">`).join('');
  dots.innerHTML = CONFIG.IMAGES.CLOSEUPS.map((_,i)=>`<button class="dot ${i===0?'on':''}" data-i="${i}"></button>`).join('');
  const imgs = [...track.querySelectorAll('img')];
  function go(i){ imgs[i].scrollIntoView({behavior:'smooth', inline:'center'}); dots.querySelectorAll('.dot').forEach((d,j)=>d.classList.toggle('on', j===i)); }
  dots.querySelectorAll('.dot').forEach(d=>d.onclick=()=>go(+d.dataset.i));
  // 若載入失敗，用封面圖兜底
  imgs.forEach(img=>img.addEventListener('error', ()=>{ img.src=CONFIG.IMAGES.HERO; }));
})();

/***************
 * 左側讚聲輪播 *
 ***************/
(function renderPraise(){
  const tags = ["回購第三年","爆汁不膩","孩子超愛","皮薄好剝","香氣乾淨","冰過更讚","送禮不踩雷","分級很穩","到貨都完好"];
  const box=document.getElementById('praiseTags');
  box.innerHTML = tags.map(t=>`<div class="tag">${t}</div>`).join('');
  let i=0; let nodes=[...box.children];
  setInterval(()=>{
    if(!nodes.length) return;
    nodes[i].style.marginTop='-28px';
    setTimeout(()=>{ box.appendChild(nodes[i]); nodes[i].style.marginTop='0'; nodes=[...box.children]; i=(i+1)%nodes.length; },420);
  },1500);
})();

/***************
 * 產品與規格    *
 ***************/
const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], sweet:4, sour:2, aroma:3, pal:["脆","多汁","清爽"], fit:["長輩","孩子","送禮"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], sweet:5, sour:3, aroma:4, pal:["細嫩","爆汁","香甜"], fit:["孩子","家庭","鮮食/現榨"], getId:(s)=>`MAO10-${s}` }
};
// 規格記憶
const SELECTED = (()=>{ try{ const s=localStorage.getItem(LS.sel); return s? JSON.parse(s):{PONGAN:'25A',MAOGAO:'25A'} }catch{ return {PONGAN:'25A',MAOGAO:'25A'} }})();
function saveSel(){ localStorage.setItem(LS.sel, JSON.stringify(SELECTED)); }
function dotsHtml(n){ return Array.from({length:5},(_,i)=>`<span class="dot ${i<n?'on':''}"></span>`).join(''); }
function priceOf(section,weight,size){ return CONFIG.PRICES[section]?.[weight]?.[size] ?? 0; }

function renderVariety(kind){
  const conf = PRODUCTS[kind];
  const rail = document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0, stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售 ${inv.sold}｜剩 ${inv.stock}`;

  // 指南
  const root = document.querySelectorAll(`#shop .variety`)[ kind==='PONGAN' ? 0 : 1 ];
  const scales = root.querySelectorAll('.g-scales .dots');
  scales[0].innerHTML = dotsHtml(conf.sweet);
  scales[1].innerHTML = dotsHtml(conf.sour);
  scales[2].innerHTML = dotsHtml(conf.aroma);
  root.querySelector('.size').textContent = CONFIG.DIAMETER_CM[SELECTED[kind]] || '依批次略有差';
  root.querySelector('.g-tags#pal-'+kind.toLowerCase()).innerHTML = conf.pal.map(t=>`<span class="tag">${t}</span>`).join('');
  root.querySelector('.g-tags#fit-'+kind.toLowerCase()).innerHTML = conf.fit.map(t=>`<span class="tag">${t}</span>`).join('');
}
function selectSpec(kind,size){ SELECTED[kind]=size; saveSel(); renderVariety(kind); }

// 產品圖
document.getElementById('img-pongan').src = CONFIG.IMAGES.PONGAN;
document.getElementById('img-maogao').src = CONFIG.IMAGES.MAOGAO;
renderVariety('PONGAN'); renderVariety('MAOGAO');

/***************
 * 產季時間軸    *
 ***************/
(function renderTimeline(){
  const months = [
    {m:10, label:"10 月", meta:"青皮椪柑", tone:2},
    {m:11, label:"11 月", meta:"椪柑高峰", tone:3},
    {m:12, label:"12 月", meta:"橙皮始｜茂谷", tone:4},
    {m:1,  label:"1 月",  meta:"橙皮穩定", tone:5},
    {m:2,  label:"2 月",  meta:"橙皮甜香", tone:4},
    {m:3,  label:"3 月",  meta:"橙皮尾聲", tone:3},
    {m:4,  label:"4 月",  meta:"儲藏柑", tone:2}
  ];
  const curM = (new Date()).getMonth()+1;
  const grid=document.getElementById('timelineGrid');
  grid.innerHTML = months.map(x=>{
    const isNow = x.m===curM;
    return `<div class="month ${isNow?'is-now':''}" data-tone="${x.tone}">
      <div class="orange"></div>
      <div class="big">${x.label}</div>
      <div class="meta">${x.meta}</div>
    </div>`;
  }).join('');
})();

/***************
 * 購物車與下單  *
 ***************/
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }

function addToCart(id,title,price,weight,size,section){
  const existed = cart.find(x=>x.id===id);
  if(existed) existed.qty++; else cart.push({ id, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); showToast('已加入購物車');
}
function addSelected(kind){
  const c=PRODUCTS[kind], s=SELECTED[kind], id=c.getId(s), price=priceOf(c.section,c.weight,s);
  addToCart(id,(kind==='PONGAN'?'椪柑':'茂谷')+`｜${c.weight}｜${s}`,price,c.weight,s,c.section);
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ const d=document.getElementById('cartDrawer'); d.classList.toggle('open', !!open); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }
document.getElementById('cartFab').onclick = ()=>toggleCart(true);
document.getElementById('queryFab').onclick = ()=>toggleQuery(true);
document.getElementById('openQuery').onclick = ()=>toggleQuery(true);
document.getElementById('openQueryFoot').onclick = ()=>toggleQuery(true);

// Render cart
function calc(){ const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0); const shipping=(subtotal>=CONFIG.FREE_SHIP_THRESHOLD||cart.length===0)?0:CONFIG.SHIPPING; return {subtotal,shipping,total:subtotal+shipping}; }
function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){ list.innerHTML='<div class="note">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>'; }
  else{
    list.innerHTML=cart.map((c,i)=>`
      <div class="cart-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0">
        <div><div><strong>${c.title}</strong></div><div class="note">${currency(c.price)} × ${c.qty}</div></div>
        <div class="qty" style="display:flex;align-items:center;border:1px solid var(--border);border-radius:10px">
          <button style="width:30px;height:30px;border:0;background:#f3f4f6" onclick="mutateQty(${i},-1)">–</button>
          <span style="display:inline-block;width:32px;text-align:center">${c.qty}</span>
          <button style="width:30px;height:30px;border:0;background:#f3f4f6" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>`).join('');
  }
  const {subtotal,shipping,total}=calc();
  document.getElementById('subtotal').textContent=currency(subtotal);
  document.getElementById('shipping').textContent=currency(shipping);
  document.getElementById('total').textContent=currency(total);
  document.getElementById('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
}
renderCart();

// 地址顯示切換 + 記憶
document.getElementById('shipSelect').addEventListener('change', e=>{
  const isHome = e.target.value.startsWith('宅配');
  document.querySelector('input[name="addr"]').toggleAttribute('required', isHome);
  document.getElementById('addrBox').style.display = isHome ? 'block' : 'none';
  rememberForm(); // 立即記憶
});

/***************
 * 表單記憶     *
 ***************/
const FORM_FIELDS = ["name","phone","email","addr","remark"];
function loadForm(){
  try{
    const s = localStorage.getItem(LS.form); if(!s) return;
    const f = JSON.parse(s) || {};
    FORM_FIELDS.forEach(k=>{ const el=document.querySelector(`[name="${k}"]`); if(el && f[k]) el.value=f[k]; });
    if(f.ship){ document.getElementById('shipSelect').value=f.ship; const isHome=f.ship.startsWith('宅配'); document.getElementById('addrBox').style.display=isHome?'block':'none'; }
    if(f.pay){ const r=document.querySelector(`input[name="pay"][value="${f.pay}"]`); if(r) r.checked=true; }
  }catch{}
}
function rememberForm(){
  const data = {};
  FORM_FIELDS.forEach(k=>{ data[k]=document.querySelector(`[name="${k}"]`)?.value||''; });
  data.ship = document.getElementById('shipSelect').value;
  data.pay = document.querySelector('input[name="pay"]:checked')?.value || 'LINEPAY';
  localStorage.setItem(LS.form, JSON.stringify(data));
}
document.getElementById('orderForm').addEventListener('input', debounce(rememberForm, 150));
document.querySelectorAll('input[name="pay"]').forEach(r=>r.addEventListener('change', rememberForm));
loadForm();

/***************
 * 送單（LINE Pay）*
 ***************/
async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀並勾選同意條款'); return; }

  const f=new FormData(ev.target);
  const ship = f.get('ship'); const addr = ship.startsWith('宅配') ? (f.get('addr')||'') : `${ship}（自取）`;
  if(ship.startsWith('宅配') && !addr){ alert('請填寫宅配地址'); return; }
  const payMethod = (document.querySelector('input[name="pay"]:checked')?.value || 'LINEPAY').toUpperCase();

  const payload={
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr, ship, remark:f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND_TAG,
    payMethod: (payMethod==='LINEPAY' ? 'linepay' : (payMethod==='BANK' ? 'bank' : 'cash'))
  };

  const btn=document.getElementById('submitBtn'); const resBox=document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; resBox.textContent='';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');

    const orderNo=d.order_no;
    if(payMethod==='LINEPAY'){
      const url = d?.linepay?.webUrl || d?.linepay?.appUrl;
      if(!url) throw new Error('LINE Pay 建立交易失敗（無回傳網址）');
      location.href = url; // 直接導到 LINE Pay（回跳由 GAS confirm）
      return;
    }
    // 匯款/自取現金
    let html = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>`;
    if(payMethod==='BANK'){
      html += `請於 24 小時內完成匯款並回報後五碼：<div class="card mini" style="margin-top:8px"><div><b>${CONFIG.BANK.name}</b></div><div>戶名：<b>${CONFIG.BANK.holder}</b></div><div>帳號：<b>${CONFIG.BANK.no}</b></div></div>`;
    }else{
      html += `請於約定時間「至石岡自取」，現場以現金付款。`;
    }
    resBox.innerHTML = html;
    cart.length=0; saveCart(); renderCart(); rememberForm(); ev.target.reset();
  }catch(e){ resBox.textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

/***************
 * 訂單查詢      *
 ***************/
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target);
  const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard');
  card.style.display='block'; card.innerHTML='查詢中…';
  try{
    const url=CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no);
    const r=await fetch(url); const data=await r.json();
    if(data.ok){
      const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—';
      const shipDate=data.shipDate?dateOnly(data.shipDate):'—';
      const trackNo=data.trackingNo||'—';
      const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">訂單查詢結果</h3><div class="note">${new Date().toLocaleString()}</div></div>
        <div class="line"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${data.status||'—'}</div>
        <div><b>出貨日期：</b>${shipDate}</div>
        <div><b>物流單號：</b>${trackNo}</div>
        <div><b>金額：</b>${total}</div>
        <div><b>品項：</b>${items}</div>`;
    }else{
      card.innerHTML='查無此訂單編號';
    }
  }catch(e){ card.innerHTML='查詢失敗：'+e.message; }
}

/***************
 * 鍵結與初始化   *
 ***************/
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id=a.getAttribute('href').slice(1); const el=document.getElementById(id);
    if(el){ e.preventDefault(); const y=el.getBoundingClientRect().top+window.scrollY-66; window.scrollTo({top:y,behavior:'smooth'}); }
  });
});
document.getElementById('freeShipText').textContent = currency(CONFIG.FREE_SHIP_THRESHOLD);

function debounce(fn,delay){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args),delay); }; }
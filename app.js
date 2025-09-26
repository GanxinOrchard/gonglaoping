/*****************
 * 基本設定
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
    PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"),
    GENERIC10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    GALLERY: [
      {type:'image', src: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"), title:"椪柑切瓣近拍"},
      {type:'image', src: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"), title:"10 台斤尺寸對比"},
      {type:'image', src: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/25%E6%96%A4%E6%A9%98%E5%AD%90.jpg"), title:"裝箱實拍"}
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
  // 參考尺寸（可自行微調）
  SIZE_MAP: { "23A":"約 7.5–8.0 cm", "25A":"約 7.0–7.5 cm", "27A":"約 6.5–7.0 cm", "30A":"約 6.0–6.5 cm" }
};

// 商品定義（只保留 10 台斤）
const PRODUCTS = {
  PONGAN:{ idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO:{ idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` }
};

const LS = { cart:'gx_cart', shipMethod:'gx_ship_method', form:'gx_form' };

/*****************
 * 小工具
 *****************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (section,weight,size)=> CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id] || 'normal'; }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
function go(e,id){ if(e) e.preventDefault(); const el=document.getElementById(id); if(!el) return; const navH=document.querySelector('.site-top')?.offsetHeight||0; const y=el.getBoundingClientRect().top+window.scrollY-navH-6; window.scrollTo({top:y,behavior:'smooth'}); }
function toggleHamburger(){ document.body.classList.toggle('nav-open'); }

/*****************
 * Hero & Motion
 *****************/
function mountHeroParallax(){
  const hero=document.getElementById('hero'); if(!hero) return;
  const onScroll=()=>{ const y=Math.min(0,(window.scrollY||window.pageYOffset)*-0.06); hero.style.setProperty('--y',`${y}px`); };
  document.addEventListener('scroll', onScroll, {passive:true}); onScroll();
}
function mountReveal(){
  const els=document.querySelectorAll('.reveal-up,.reveal-l,.reveal-r');
  const io=new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } }),{threshold:.12});
  els.forEach(el=>io.observe(el));
}

/*****************
 * 品牌故事輪播
 *****************/
const STORIES = [
  { title:"從日照開始的甜", text:"公老坪日夜溫差大，讓果實把甜慢慢存起來，香氣乾淨不膩口。" },
  { title:"我們只做簡單的事", text:"手工採收、逐顆分級，不拼裝、不誇大，穩定才是回購的關鍵。" },
  { title:"把理賠講清楚", text:"怎麼做，我們就怎麼賠。開箱錄影 24 小時內傳給我們，剩下交給我們處理。" }
];
function renderStory(){
  const rail=document.getElementById('storyRail');
  rail.innerHTML = STORIES.map(s=>`
    <article class="story-card-item">
      <h3>${s.title}</h3>
      <p class="muted" style="margin:6px 0 0">${s.text}</p>
    </article>
  `).join('');
}
function storyGo(dir){ const rail=document.getElementById('storyRail'); if(!rail) return; const w=rail.querySelector('.story-card-item')?.offsetWidth||320; rail.scrollBy({left:dir*w,behavior:'smooth'}); }
const storyPrev=()=>storyGo(-1), storyNext=()=>storyGo(1);

/*****************
 * 果實近拍（1:1 + dots）
 *****************/
let gIndex=0, gTimer=null, gHold=false;
function renderGallery(){
  const rail=document.getElementById('galleryRail'); const dots=document.getElementById('galleryDots'); if(!rail) return;
  rail.innerHTML = CONFIG.IMAGES.GALLERY.map((g,i)=>`
    <article class="gallery-card">
      <div class="gallery-media">${g.type==='video'
        ? `<video src="${g.src}" controls playsinline preload="metadata"></video>`
        : `<img src="${g.src}" alt="${g.title||''}" loading="${i<2?'eager':'lazy'}">`}</div>
      ${g.title?`<div class="gallery-caption">${g.title}</div>`:''}
    </article>`).join('');
  dots.innerHTML = CONFIG.IMAGES.GALLERY.map((_,i)=>`<span class="slider-dot ${i===0?'on':''}"></span>`).join('');

  const railHold=()=>{gHold=true;clearInterval(gTimer);}
  const railFree=()=>{gHold=false;startGalleryAuto();}
  rail.addEventListener('pointerdown', railHold, {passive:true});
  rail.addEventListener('pointerup', railFree, {passive:true});
  rail.addEventListener('mouseenter', railHold); rail.addEventListener('mouseleave', railFree);

  rail.addEventListener('scroll', ()=>{
    const cards=[...rail.querySelectorAll('.gallery-card')]; if(!cards.length) return;
    const center=rail.scrollLeft+rail.clientWidth/2; let best=0,bd=Infinity;
    cards.forEach((c,i)=>{ const cx=c.offsetLeft+c.clientWidth/2; const d=Math.abs(cx-center); if(d<bd){bd=d;best=i;} });
    if(best!==gIndex){ gIndex=best; const ds=dots.querySelectorAll('.slider-dot'); ds.forEach((d,i)=>d.classList.toggle('on',i===gIndex)); }
  },{passive:true});
}
function galleryNext(){ goTo(gIndex+1); }
function goTo(i){
  const rail=document.getElementById('galleryRail'); if(!rail) return;
  const cards=[...rail.querySelectorAll('.gallery-card')]; if(!cards.length) return;
  gIndex=(i+cards.length)%cards.length; const x=cards[gIndex].offsetLeft-rail.offsetLeft; rail.scrollTo({left:x,behavior:'smooth'});
  const ds=document.querySelectorAll('#galleryDots .slider-dot'); ds.forEach((d,idx)=>d.classList.toggle('on',idx===gIndex));
}
function startGalleryAuto(){ clearInterval(gTimer); gTimer=setInterval(()=>{ if(!gHold) galleryNext(); }, 3800); }

/*****************
 * 產品卡：規格籤 / 價格 / 尺寸 / 庫存
 *****************/
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };
function renderProduct(kind){
  const conf=PRODUCTS[kind];
  // 圖片
  document.getElementById('img-'+kind.toLowerCase()).src = (CONFIG.IMAGES[kind]||CONFIG.IMAGES.GENERIC10);

  // 規格籤
  const rail=document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');

  // 價格／庫存／尺寸
  const price=priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  const pid=conf.getId(SELECTED[kind]); const inv=CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock}`;
  document.getElementById('size-'+kind.toLowerCase()).textContent = `參考尺寸：${CONFIG.SIZE_MAP[SELECTED[kind]]||'—'}`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderProduct(kind); }
function addSelected(kind){
  const conf=PRODUCTS[kind]; const size=SELECTED[kind]; const pid=conf.getId(size);
  const price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size,conf.section);
}

/*****************
 * 購物車
 *****************/
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function addToCart(id,title,price,weight,size,section){
  if(statusOf(id)==='soldout'){ showToast('此品項已售完'); return; }
  const ex=cart.find(x=>x.id===id); if(ex) ex.qty++; else cart.push({id,title,price,qty:1,weight,size,section});
  saveCart(); renderCart(); bumpFab(); showToast('已加入購物車');
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }

function getShipMethod(){ return localStorage.getItem(LS.shipMethod)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.shipMethod,m);
  document.getElementById('shipHomeBtn').className = (m==='HOME') ? 'btn' : 'btn-ghost';
  document.getElementById('shipPickBtn').className = (m==='PICKUP') ? 'btn' : 'btn-ghost';
  // 宅配 vs 自取欄位
  document.getElementById('homeFields').style.display = (m==='HOME')?'block':'none';
  document.getElementById('pickupFields').style.display = (m==='PICKUP')?'block':'none';
  document.getElementById('cashOnly').style.display = (m==='PICKUP')?'inline-block':'none';
  renderCart();
}
function calc(){
  const method=getShipMethod();
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping = method==='PICKUP' ? 0 : ((subtotal>=CONFIG.FREE_SHIP_THRESHOLD||cart.length===0)?0:CONFIG.SHIPPING);
  return {subtotal,shipping,total:subtotal+shipping};
}
function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){ list.innerHTML='<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>'; }
  else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="cart-row">
        <div>
          <div><strong>${c.title}</strong></div>
          <div class="muted">${currency(c.price)} × ${c.qty}</div>
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
  document.getElementById('shipLabel').textContent = getShipMethod()==='PICKUP' ? '運費（自取免運）' : '運費（宅配）';
}

/*****************
 * 下單與付款（LINE Pay / 匯款 / 現金自取）
 *****************/
function saveForm(){ const f=document.getElementById('orderForm'); const obj=Object.fromEntries(new FormData(f)); obj.shipMethod=getShipMethod(); localStorage.setItem(LS.form, JSON.stringify(obj)); }
function loadForm(){ try{ const s=localStorage.getItem(LS.form); if(!s) return; const obj=JSON.parse(s); const f=document.getElementById('orderForm'); for(const k in obj){ if(f[k]) f[k].value=obj[k]; } setShipMethod(obj.shipMethod||'HOME'); }catch{} }

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  if(!document.getElementById('agree').checked){ alert('請先閱讀並勾選同意'); return; }

  const f=new FormData(ev.target); const method=getShipMethod();
  for(const k of ['name','phone','email']) if(!f.get(k)) return alert('請完整填寫訂單資料');
  if(method==='HOME' && !f.get('addr')) return alert('請填寫宅配地址');

  const payload={
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr: method==='PICKUP' ? '自取（台中市石岡區石岡街61號）' : (f.get('addr')||''),
    ship: method==='PICKUP' ? '自取' : '宅配',
    remark: method==='PICKUP' ? (f.get('pickupNote')||'') : (f.get('remark')||''),
    pay: (document.querySelector('input[name="pay"]:checked')?.value)||'LINEPAY',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND_TAG
  };

  const btn=document.getElementById('submitBtn'); const res=document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; res.textContent='';
  try{
    // 建立訂單（沿用 GAS）
    const r=await fetch(CONFIG.GAS_ENDPOINT,{method:'POST',body:JSON.stringify(payload)}); const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');
    const orderNo=d.order_no;

    const pm=payload.pay;
    if(pm==='LINEPAY'){
      await goLinePay(orderNo, payload);
      return;
    }else if(pm==='BANK'){
      res.innerHTML = `✅ 訂單已建立（<b>${orderNo}</b>）。請於 24 小時內匯款並回覆後五碼：<div class="card content" style="margin-top:8px"><div><b>${CONFIG.BANK.name}</b></div><div>戶名：<b>${CONFIG.BANK.holder}</b></div><div>帳號：<b>${CONFIG.BANK.no}</b></div></div>`;
    }else{
      res.innerHTML = `✅ 訂單已建立（<b>${orderNo}</b>）。取貨時於現場以現金付款即可。`;
    }
    cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
  }catch(e){ res.textContent='送出失敗：'+e.message; }
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
  location.href = d.paymentUrl;
}

// 回跳確認（若你的 GAS 已處理 return/cancel，這段會自動確認）
(function handleLinePayReturn(){
  const q=new URLSearchParams(location.search);
  if(q.get('lp')==='return'){
    const orderNo=localStorage.getItem('gx_lp_orderNo');
    const amount=Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId=q.get('transactionId');
    if(orderNo && transactionId){
      fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_confirm',{method:'POST',body:JSON.stringify({orderNo,transactionId,amount,currency:CONFIG.PAY.currency})})
        .then(r=>r.json())
        .then(d=>{
          if(d.ok){ showToast('付款成功，感謝支持！'); cart.length=0; saveCart(); renderCart(); }
          else alert('付款確認失敗：'+(d.msg||'')); 
          localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount');
        })
        .catch(e=>alert('付款確認錯誤：'+e.message));
    }
  }
})();

/*****************
 * 訂單查詢
 *****************/
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target); const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard'); card.style.display='block'; card.innerHTML='查詢中…';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no)); const d=await r.json();
    if(d.ok){
      const total=d.total?`NT$ ${(d.total||0).toLocaleString()}`:'—';
      const items=Array.isArray(d.items)? d.items.map(i=>`${i.title} × ${i.qty}`).join('、'):'—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px"><h3 style="margin:0">訂單查詢</h3><div class="muted">${new Date().toLocaleString()}</div></div>
        <div class="line" style="margin:10px 0"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>狀態：</b>${d.status||'—'}</div>
        <div><b>出貨日期：</b>${d.shipDate?dateOnly(d.shipDate):'—'}</div>
        <div><b>追蹤號碼：</b>${d.trackingNo||'—'}</div>
        <div><b>金額：</b>${total}</div>
        <div><b>品項：</b>${items}</div>`;
    }else card.textContent='查無此訂單';
  }catch(e){ card.textContent='查詢失敗：'+e.message; }
}

/*****************
 * 評價膠囊（小面板）
 *****************/
function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function maskName(s){ s=String(s||''); if(s.length<=2) return s[0]+'○'; return s[0]+'○'.repeat(s.length-2)+s[s.length-1]; }
function seasonalDate(){ const now=new Date(); const y=now.getFullYear(); const start=(now.getMonth()+1)>=11?y:y-1; const a=new Date(start,10,1).getTime(), b=Math.min(now.getTime(), new Date(start+1,2,31).getTime()); const t=a+Math.random()*(b-a); const d=new Date(t); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }
function genReviews(n=30){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","妤","柔","軒","瑜","嘉","翔","凱"];
  const texts=["果香乾淨，家人一直回購","皮薄好剝，冰過更甜","尺寸漂亮，吃起來很順","現採分級穩定不踩雷","送禮很體面，朋友喜歡","汁多香甜，小孩狂吃"];
  const sizes=["23A","25A","27A","30A"]; const arr=[];
  for(let i=0;i<n;i++) arr.push({name:maskName(randPick(last)+randPick(given)), date:seasonalDate(), spec:`10台斤｜${randPick(sizes)}`, text:randPick(texts)});
  return arr.sort((a,b)=>a.date<b.date?1:-1);
}
function renderReviews(){
  const box=document.getElementById('rvList'); if(!box) return;
  const list=genReviews(36);
  box.innerHTML = list.map(r=>`<div class="rv-item"><div><b>${r.name}</b>｜${r.date}</div><div class="muted">${r.spec}</div><p style="margin:6px 0 0">${r.text}</p></div>`).join('');
}
function toggleRv(open){ const p=document.getElementById('rvPanel'); p.classList.toggle('open', open!==false && !p.classList.contains('open')); if(open===false) p.classList.remove('open'); }
document.getElementById('rvPill')?.addEventListener('click', ()=>toggleRv());

/*****************
 * 條款：捲到底才可勾
 *****************/
(function setupPolicy(){
  const det=document.getElementById('policy'); const agree=document.getElementById('agree');
  const enable=()=>{ const sc=det.scrollTop+det.clientHeight; const need=det.scrollHeight-10; if(sc>=need){ agree.disabled=false; } };
  det?.addEventListener('scroll', enable, {passive:true});
})();

/*****************
 * 初始化
 *****************/
function init(){
  // 圖片
  document.querySelector('.hero-bg').style.backgroundImage = `url('${CONFIG.IMAGES.HERO}')`;

  // 故事／近拍／產品
  renderStory();
  renderGallery();
  renderProduct('PONGAN');
  renderProduct('MAOGAO');

  // 指南（延用原概念：甜度/酸度/香氣＋族群）
  const guide=document.getElementById('guideBox');
  guide.innerHTML = `
    <div><h3>甜度 / 酸度 / 香氣</h3><p class="muted">椪柑：甜 4、酸 2、香 3｜茂谷：甜 4.5、酸 2.5、香 4</p></div>
    <div><h3>口感關鍵詞</h3><p class="muted">椪柑：脆、多汁、清爽｜茂谷：細嫩、爆汁、香甜</p></div>
    <div><h3>適合族群</h3><ul>
      <li>長輩：椪柑 27A / 30A（好剝、香氣溫和）</li>
      <li>孩子：茂谷 25A（細嫩多汁、不易噎）</li>
      <li>送禮：椪柑 25A（穩定不踩雷）</li></ul></div>
  `;

  // 產季（延用原概念）
  const tl=document.getElementById('timelineBox');
  const months=["10 月｜青皮椪柑","11 月｜椪柑高峰","12 月｜橙皮始/茂谷","1 月｜橙皮穩定","2 月｜橙皮甜香","3 月｜橙皮尾聲","4 月｜儲藏柑"];
  tl.innerHTML = months.map(m=>`<div class="month"><b>${m.split('｜')[0]}</b><div class="muted">${m.split('｜')[1]}</div></div>`).join('');

  // 小教室
  const sc=document.getElementById('schoolBox');
  sc.innerHTML = `
    <div class="card content"><h3>保存</h3><ul>
      <li>冷藏更穩定；常溫請避開日照與悶熱。</li></ul></div>
    <div class="card content"><h3>切法</h3><ul>
      <li>茂谷：沿果蒂放射 4 刀 → 6 塊，不流汁。</li>
      <li>椪柑：直接手剝，冰過更清爽。</li></ul></div>
  `;

  // 購物車
  document.getElementById('freeShipText').textContent = 'NT$ '+CONFIG.FREE_SHIP_THRESHOLD.toLocaleString();
  renderCart(); setShipMethod(getShipMethod());
  // 動效
  mountHeroParallax(); mountReveal();
  // 評價
  renderReviews();
  // 近拍自動播放
  startGalleryAuto();
}
init();

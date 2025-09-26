/*****************
 * 基本設定與素材 *
 *****************/
const CONFIG = {
  BRAND: "柑心果園",
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency:'TWD' }, // LINE Pay 機密請放到 GAS，前端不存金鑰
  BANK: { name:"連線銀行(824)", holder:"張鈞泓", no:"11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    LOGO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png"),
    PRODUCT10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    FRUIT_PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    FRUIT_MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png")
  },
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
  STATUS: {
    "PON10-23A":"preorder","PON10-25A":"preorder","PON10-27A":"preorder","PON10-30A":"preorder",
    "MAO10-23A":"preorder","MAO10-25A":"preorder","MAO10-27A":"preorder","MAO10-30A":"preorder"
  }
};

// 等級直徑（參考值；可依實際調整）
const SIZE_CM = { "23A":"約 6.5–7.0 cm", "25A":"約 7.0–7.5 cm", "27A":"約 7.5–8.0 cm", "30A":"約 8.0–8.5 cm" };

// 產品定義（僅 10 台斤）
const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` }
};

// LocalStorage Keys
const LS = { cart:'gx_cart', shipMethod:'gx_ship_method', form:'gx_form' };

/*****************
 * 工具函式
 *****************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (section,weight,size)=> CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id] || 'normal'; }
function $(sel){ return document.querySelector(sel); }
function el(id){ return document.getElementById(id); }
function showToast(msg){ const t=el('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }

/*****************
 * 首屏素材設定
 *****************/
function setHero(){
  const hero = el('hero');
  hero.style.backgroundImage = `url('${CONFIG.IMAGES.HERO}')`;
  el('brandLogo').src = CONFIG.IMAGES.LOGO;
  el('heroLogo').src = CONFIG.IMAGES.LOGO;
  el('footerLogo').src = CONFIG.IMAGES.LOGO;
}

/*****************
 * 品牌故事輪播
 *****************/
function storyCarousel(){
  const track = el('bcTrack');
  let index = 0;
  const total = track.children.length;
  const go = (i)=>{ index = (i+total)%total; track.style.transform = `translateX(-${index*100}%)`; track.style.transition='transform .35s ease'; };
  el('bcPrev').onclick=()=>go(index-1);
  el('bcNext').onclick=()=>go(index+1);
  setInterval(()=>go(index+1), 6000);
}

/*****************
 * 三信任點滑入
 *****************/
function setupReveal(){
  const io = new IntersectionObserver((ents)=>{
    ents.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('reveal'); io.unobserve(e.target); }
    });
  }, {threshold:.15});
  document.querySelectorAll('.kpi').forEach(k=>io.observe(k));
}

/*****************
 * 規格選擇與尺寸顯示
 *****************/
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };
function renderSpecChips(kind){
  const conf = PRODUCTS[kind]; const rail = el('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  el('price-'+kind.toLowerCase()).textContent = currency(price);
  el('sz-'+kind.toLowerCase()).textContent = SIZE_CM[SELECTED[kind]]||'';
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  el('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock} 箱`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); }
function addSelected(kind){
  const conf=PRODUCTS[kind], size=SELECTED[kind];
  const pid=conf.getId(size), price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size,conf.section);
}
function setProductImages(){
  el('img-pongan').src = CONFIG.IMAGES.PRODUCT10;
  el('img-maogao').src = CONFIG.IMAGES.PRODUCT10;
}

/*****************
 * 果實近拍輪播
 *****************/
function buildGallery(){
  const imgs = [CONFIG.IMAGES.FRUIT_PONGAN, CONFIG.IMAGES.FRUIT_MAOGAO, CONFIG.IMAGES.PRODUCT10];
  const track = el('galTrack');
  track.innerHTML = imgs.map(src=>`<img src="${src}" alt="果實">`).join('');
  let idx=0;
  const go = (delta)=>{ idx = Math.max(0, Math.min(imgs.length-1, idx+delta)); const childWidth = track.children[0].getBoundingClientRect().width+12; track.scrollTo({left:childWidth*idx, behavior:'smooth'}); };
  el('galPrev').onclick = ()=>go(-1);
  el('galNext').onclick = ()=>go(+1);
}

/*****************
 * 小浮窗：買過都說讚
 *****************/
function setupReviews(){
  const names="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","熒","容","翔","修","均","凱"];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  function mask(n){ return n[0]+"○".repeat(n.length-2)+n[n.length-1]; }
  const list = Array.from({length:24}).map(()=>`${mask(pick(names)+pick(given)+pick(given))}：買過都說讚！`);
  const box = el('rvvTrack');
  box.innerHTML = list.concat(list).map(t=>`<div class="rv-line">🍊 ${t}</div>`).join('');
  // 跑動
  box.classList.add('rvv-run');
  // 開合
  const holder = el('rvv');
  el('rvvToggle').onclick = ()=> holder.classList.toggle('open');
}

/*****************
 * 購物車邏輯
 *****************/
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=el('cartFab'); f.style.transform='scale(1.06)'; setTimeout(()=>f.style.transform='',200); }
function addToCart(id,title,price,weight,size,section){
  if(statusOf(id)==='soldout'){ showToast('此品項已售完'); return; }
  const exists = cart.find(x=>x.id===id);
  if(exists) exists.qty++;
  else cart.push({ id,title,price,qty:1,weight,size,section });
  saveCart(); renderCart(); bumpFab();
  showToast('已加入購物車');
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ el('cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ el('queryDrawer').classList.toggle('open', !!open); }

function getShipMethod(){ return localStorage.getItem(LS.shipMethod)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.shipMethod,m);
  el('shipHomeBtn').className = (m==='HOME')?'btn':'btn-ghost';
  el('shipPickupBtn').className = (m==='PICKUP')?'btn':'btn-ghost';
  const shipSel=document.querySelector('select[name="ship"]');
  if(shipSel) shipSel.value = (m==='HOME')?'宅配':'自取（台中市石岡區石岡街61號）';
  el('homeFields').style.display = (m==='HOME') ? 'block':'none';
  renderPayChoices(); renderCart();
}

function calc(){
  const m=getShipMethod();
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  let shipping = (m==='HOME') ? ((subtotal>=CONFIG.FREE_SHIP_THRESHOLD || cart.length===0)?0:CONFIG.SHIPPING) : 0;
  return {subtotal, shipping, total: subtotal+shipping};
}

function renderCart(){
  const list=el('cartList');
  if(!cart.length){ list.innerHTML='<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>'; }
  else{
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
      </div>`).join('');
  }
  const {subtotal,shipping,total}=calc();
  el('subtotal').textContent=currency(subtotal);
  el('shipping').textContent=currency(shipping);
  el('total').textContent=currency(total);
  el('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
  el('shipLabel').textContent = (getShipMethod()==='HOME')? '運費（宅配）':'運費（自取｜$0）';
  el('freeShipText').textContent = 'NT$ '+CONFIG.FREE_SHIP_THRESHOLD.toLocaleString();
}

/*****************
 * 付款方式（LINE Pay 綠色膠囊 / 匯款；自取＝現金）
 *****************/
function renderPayChoices(){
  const hold = el('payChoices');
  const m = getShipMethod();
  if(m==='PICKUP'){
    hold.innerHTML = pill('CASH','現場現金', true);
  }else{
    hold.innerHTML = pill('LINEPAY','LINE Pay', true, true) + pill('BANK','匯款');
  }
  // 樣式與事件
  hold.querySelectorAll('.pay-pill').forEach(p=>{
    p.addEventListener('click',()=>{
      hold.querySelectorAll('.pay-pill').forEach(x=>x.classList.remove('active'));
      p.classList.add('active');
      p.querySelector('input').checked = true;
    });
  });
  function pill(val, label, active=false, isLine=false){
    return `
      <label class="pay-pill ${isLine?'pay-line':''} ${active?'active':''}">
        <input type="radio" name="pay" value="${val}" ${active?'checked':''}>
        ${isLine?'<span class="tag">LINE PAY</span>':''}
        <span>${label}</span>
      </label>`;
  }
}

/*****************
 * 下單與 LINE Pay 走法
 *****************/
function saveForm(){ const f=el('orderForm'); const obj=Object.fromEntries(new FormData(f)); obj.shipMethod=getShipMethod(); localStorage.setItem(LS.form, JSON.stringify(obj)); }
function loadForm(){ try{ const s=localStorage.getItem(LS.form); if(!s) return; const obj=JSON.parse(s); const f=el('orderForm'); for(const k in obj){ if(f[k]) f[k].value=obj[k]; } setShipMethod(obj.shipMethod||'HOME'); }catch{} }

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  if(!el('agree').checked){ alert('請先閱讀「物流與退貨說明」並勾選同意'); return; }

  const f=new FormData(ev.target);
  const shipMethod=getShipMethod();
  f.set('ship', shipMethod==='PICKUP' ? '自取（台中市石岡區石岡街61號）' : f.get('ship'));
  if(shipMethod==='HOME' && !f.get('addr')) return alert('請填寫宅配地址');

  const pay = document.querySelector('input[name="pay"]:checked')?.value || (shipMethod==='PICKUP'?'CASH':'LINEPAY');

  const payload = {
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr: shipMethod==='PICKUP' ? '自取（台中市石岡區石岡街61號）' : (f.get('addr')||''),
    ship: shipMethod==='PICKUP' ? '自取' : '宅配',
    remark:f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND_TAG,
    shipMeta:{method:shipMethod}
  };

  const btn=el('submitBtn'); const res=el('result');
  btn.disabled=true; btn.textContent='處理中…'; res.textContent='';

  try{
    // 建立訂單
    const r1=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d1=await r1.json();
    if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
    const orderNo = d1.order_no;

    if(pay==='LINEPAY'){
      // 轉 LINE Pay（由 GAS 持有金鑰）
      const body={ orderNo, amount:payload.summary.total, currency:CONFIG.PAY.currency, items:payload.items };
      const r=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_request', { method:'POST', body: JSON.stringify(body) });
      const d=await r.json();
      if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
      localStorage.setItem('gx_lp_orderNo', orderNo);
      localStorage.setItem('gx_lp_amount', String(payload.summary.total));
      location.href = d.paymentUrl;
      return;
    }

    if(pay==='BANK'){
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。\
        <div class="card" style="padding:10px; margin-top:8px">
          <div><b>${CONFIG.BANK.name}</b></div>
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>
        </div>`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
      return;
    }

    if(pay==='CASH'){
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>自取地點：台中市石岡區石岡街 61 號（請備註期望時間）。現場以現金付款。`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
      return;
    }

  }catch(e){
    res.textContent='送出失敗：'+e.message;
  }finally{
    btn.disabled=false; btn.textContent='送出訂單';
  }
}

// LINE Pay 返回確認（GAS 進行 confirm，前端只帶 orderNo / transactionId）
(async function handleLinePayReturn(){
  const p=new URLSearchParams(location.search);
  if(p.get('lp')==='return'){
    const orderNo=localStorage.getItem('gx_lp_orderNo');
    const amount=Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId=p.get('transactionId');
    if(orderNo && transactionId){
      try{
        const body={ orderNo, transactionId, amount, currency:CONFIG.PAY.currency };
        const r=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_confirm', { method:'POST', body: JSON.stringify(body) });
        const d=await r.json();
        if(d.ok){
          showToast('付款成功，感謝支持！');
          cart.length=0; saveCart(); renderCart();
          localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount');
        }else alert('付款確認失敗：'+(d.msg||''));
      }catch(e){ alert('付款確認錯誤：'+e.message); }
    }
  }
})();

/*****************
 * 訂單查詢
 *****************/
function dateOnly(val){
  if(!val) return '—';
  try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }
  catch(e){}
  return String(val).split(/[ T]/)[0];
}
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target); const no=(f.get('orderNo')||'').trim();
  const card=el('queryCard'); const printBtn=el('printBtn');
  card.style.display='block'; card.innerHTML='查詢中…'; printBtn.style.display='none';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no));
    const data=await r.json();
    if(data.ok){
      const s=data.status||'（未提供狀態）'; const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—';
      const shipDate=data.shipDate?dateOnly(data.shipDate):'—'; const trackNo=data.trackingNo||'—';
      const hct=`<a href="https://www.hct.com.tw/search/searchgoods_n.aspx" target="_blank" rel="noopener">新竹貨運查詢</a>`;
      const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、'):'—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h3 style="margin:0">訂單查詢結果</h3>
          <div class="note">${new Date().toLocaleString()}</div>
        </div>
        <div class="line"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${s}</div>
        <div><b>出貨日期：</b>${shipDate}</div>
        <div><b>物流單號：</b>${trackNo}</div>
        <div><b>物流查詢：</b>${hct}</div>
        <div><b>金額：</b>${total}</div>
        <div><b>品項：</b>${items}</div>`;
      printBtn.style.display='inline-flex';
    }else{
      card.innerHTML='查無此訂單編號';
    }
  }catch(e){
    card.innerHTML='查詢失敗：'+e.message;
  }
}

/*****************
 * 導覽漢堡
 *****************/
(function navToggle(){
  const btn=el('menuBtn'), menu=el('menu');
  btn.addEventListener('click', ()=>{
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open?'true':'false');
  });
})();

/*****************
 * Policy 同意捲到底啟用
 *****************/
(function setupPolicy(){
  const det=el('policy'), agree=el('agree');
  const en=()=>{ const sc=det.scrollTop+det.clientHeight; const need=det.scrollHeight-10; if(sc>=need) agree.disabled=false; };
  det.addEventListener('toggle', ()=>{ if(det.open){ det.focus(); }});
  det.addEventListener('scroll', en, {passive:true});
})();

/*****************
 * 初始化
 *****************/
function init(){
  setHero();
  setProductImages();
  renderSpecChips('PONGAN');
  renderSpecChips('MAOGAO');
  buildGallery();
  storyCarousel();
  setupReveal();
  setupReviews();
  setShipMethod(getShipMethod());
  renderCart();
  loadForm();
  // HERO 紙感紋理（加分）：以 CSS 已加在 styles.css
}
document.addEventListener('DOMContentLoaded', init);

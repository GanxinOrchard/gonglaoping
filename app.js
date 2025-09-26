/**************
 * 資料設定   *
 **************/
const CONFIG = {
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    PRODUCT: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    PONGAN_CLOSE: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    MAOGAO_CLOSE: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"),
    LOGO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png")
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
  }
};

// 尺寸(直徑)參考（依常見分級區間；實際會因產地/批次略有差）
const SIZE_CM = {
  "23A": "約 6.7–7.3 cm",
  "25A": "約 7.4–8.0 cm",
  "27A": "約 8.0–8.6 cm",
  "30A": "約 8.6–9.6 cm"
};

// 產品設定
const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` }
};

// LS keys
const LS = { cart:'gx_cart', shipMethod:'gx_ship_method', form:'gx_form' };

/**************
 * 共用工具   *
 **************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (section,weight,size)=> CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id] || 'normal'; }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
function go(e,id){ if(e) e.preventDefault(); const el=document.getElementById(id); if(!el) return; const navH=document.querySelector('.topbar')?.offsetHeight||0; const y=el.getBoundingClientRect().top+window.scrollY-navH-6; window.scrollTo({top:y,behavior:'smooth'}); }

/**************
 * Hero & 圖片
 **************/
(function initHero(){
  const hero = document.getElementById('heroImg');
  hero.src = CONFIG.IMAGES.HERO;
})();

/**************
 * 左側「買過都說讚」小膠囊
 **************/
(function renderPraise(){
  const msgs = ["買過都說讚","團購主回購中","回購率超高","冰過更清甜","手剝不黏手"];
  const track = document.getElementById('praiseTrack');
  const html = msgs.concat(msgs).map(t=>`<div class="p-badge">🍊 ${t}</div>`).join('');
  track.innerHTML = html;
})();

/**************
 * 品種卡：規格籤/價錢/存量/尺寸
 **************/
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };

function renderSizeBadges(){
  document.querySelector('.sizes-pongan').innerHTML =
    PRODUCTS.PONGAN.sizes.map(s=>`<span class="size-badge">${s}｜${SIZE_CM[s]}</span>`).join('');
  document.querySelector('.sizes-maogao').innerHTML =
    PRODUCTS.MAOGAO.sizes.map(s=>`<span class="size-badge">${s}｜${SIZE_CM[s]}</span>`).join('');
}

function renderSpec(kind){
  const conf=PRODUCTS[kind]; const rail=document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock} 箱`;
}

function selectSpec(kind,size){ SELECTED[kind]=size; renderSpec(kind); }

(function initVariety(){
  document.getElementById('img-pongan').src = CONFIG.IMAGES.PRODUCT;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.PRODUCT;
  renderSizeBadges();
  renderSpec('PONGAN'); renderSpec('MAOGAO');
})();

/**************
 * 果實近拍 1:1 輪播（手機一張）
 **************/
(function fruit(){
  const track = document.getElementById('fruitTrack');
  const dots = document.getElementById('fruitDots');
  const figs = [...track.querySelectorAll('img')];
  figs.forEach(img=>{ img.src = img.getAttribute('data-img'); });
  if(window.matchMedia('(max-width: 900px)').matches){
    // 簡單滑動：左右滑改為點點切換
    let idx=0; figs.forEach((_,i)=>dots.insertAdjacentHTML('beforeend',`<button ${i===0?'class="active"':''} aria-label="第 ${i+1} 張"></button>`));
    const btns=[...dots.querySelectorAll('button')];
    function go(i){ idx=i; btns.forEach((b,j)=>b.classList.toggle('active',j===idx)); track.style.transform=`translateX(${-idx*100}%)`; track.style.display='grid'; track.style.gridTemplateColumns=`repeat(${figs.length},100%)`; track.style.transition='transform .35s ease'; }
    btns.forEach((b,i)=>b.addEventListener('click',()=>go(i)));
    go(0);
  }
})();

/**************
 * 流程圓鈕
 **************/
function openStep(n){
  [...document.querySelectorAll('#flowCards article')].forEach(a=>a.classList.remove('show'));
  const t = document.querySelector(`#flowCards article[data-step="${n}"]`);
  if(t) t.classList.add('show');
}

/**************
 * 故事輪播
 **************/
let storyIndex=0;
(function storyInit(){
  const track=document.getElementById('storyTrack');
  [...track.querySelectorAll('.story-bg')].forEach(bg=>{
    const u=bg.getAttribute('data-img'); bg.style.backgroundImage=`url('${u}')`; bg.classList.add('loaded');
  });
})();
function storyNext(){ storyIndex=(storyIndex+1)%3; document.getElementById('storyTrack').style.transform=`translateX(-${storyIndex*100}%)`; }
function storyPrev(){ storyIndex=(storyIndex+2)%3; document.getElementById('storyTrack').style.transform=`translateX(-${storyIndex*100}%)`; }

/**************
 * 進場滑入（為 why 三卡）
 **************/
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('show'); });
},{threshold:.2});
document.querySelectorAll('.slide-from-left,.slide-from-right,.slide-from-bottom').forEach(el=>io.observe(el));

/**************
 * 購物車邏輯（浮動＋新配送/付款）
 **************/
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function addToCart(pid,title,price,weight,size,section){
  if(statusOf(pid)==='soldout'){ showToast('此品項已售完'); return; }
  const existed = cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({ id:pid, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); bumpFab(); showToast('已加入購物車');
}
function addSelected(kind){
  const conf=PRODUCTS[kind]; const size=SELECTED[kind]; const pid=conf.getId(size);
  const price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size, conf.section);
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }

function getShipMethod(){ return localStorage.getItem(LS.shipMethod)||'HOME'; }
function setShipMethod(m){
  localStorage.setItem(LS.shipMethod,m);
  document.getElementById('shipHomeBtn').className = (m==='HOME') ? 'btn' : 'btn-ghost';
  document.getElementById('shipPickupBtn').className = (m==='PICKUP') ? 'btn' : 'btn-ghost';
  document.getElementById('shipDoorBtn').className = (m==='DOOR') ? 'btn' : 'btn-ghost';
  renderCart();
}
function calc(){
  const method=getShipMethod();
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  let shipping=0;
  if(method==='HOME'){
    shipping=(subtotal>=CONFIG.FREE_SHIP_THRESHOLD||cart.length===0)?0:CONFIG.SHIPPING;
  }else{
    shipping=0; // 自取與到府服務免運（到府需門檻在 submit 再檢查）
  }
  return {subtotal,shipping,total:subtotal+shipping};
}
function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){
    list.innerHTML='<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>';
  }else{
    list.innerHTML=cart.map((c,i)=>`
      <div class="cart-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0">
        <div>
          <div><strong>${c.title}</strong></div>
          <div class="note">${currency(c.price)} × ${c.qty}</div>
        </div>
        <div class="qty" style="display:flex;align-items:center;border:1px solid var(--border);border-radius:10px">
          <button aria-label="減少" onclick="mutateQty(${i},-1)">–</button>
          <span style="width:32px;text-align:center">${c.qty}</span>
          <button aria-label="增加" onclick="mutateQty(${i},1)">＋</button>
        </div>
      </div>`).join('');
  }
  const {subtotal,shipping,total}=calc();
  document.getElementById('subtotal').textContent=currency(subtotal);
  document.getElementById('shipping').textContent=currency(shipping);
  document.getElementById('total').textContent=currency(total);
  document.getElementById('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);

  const method=getShipMethod();
  document.getElementById('shipLabel').textContent = method==='HOME'? '運費（宅配）':'運費（免運）';

  // 同步下拉
  const shipSel=document.querySelector('select[name="ship"]');
  if(shipSel){
    if(method==='HOME') shipSel.value='宅配';
    else if(method==='PICKUP') shipSel.value='自取（台中市石岡區石岡街61號）';
    else if(method==='DOOR') shipSel.value='到府服務（台中滿 5 箱）';
  }
}

/**************
 * 下單/付款
 **************/
function saveForm(){ const f=document.getElementById('orderForm'); const obj=Object.fromEntries(new FormData(f)); obj.shipMethod=getShipMethod(); localStorage.setItem(LS.form, JSON.stringify(obj)); }
function loadForm(){ try{ const s=localStorage.getItem(LS.form); if(!s) return; const obj=JSON.parse(s); const f=document.getElementById('orderForm'); for(const k in obj){ if(f[k]) f[k].value=obj[k]; } setShipMethod(obj.shipMethod||'HOME'); }catch{} }

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀條款並勾選同意'); return; }

  const f=new FormData(ev.target);
  const method=getShipMethod();
  const shipLabel = method==='HOME' ? '宅配' : (method==='PICKUP' ? '自取（台中市石岡區石岡街61號）' : '到府服務（台中滿 5 箱）');
  f.set('ship', shipLabel);

  for(const key of ['name','phone','email']) if(!f.get(key)) return alert('請完整填寫訂單資料');
  if(method!=='PICKUP' && !f.get('addr')) return alert('請填寫地址（宅配/到府）');

  // 到府服務檢查
  if(method==='DOOR'){
    const totalQty = cart.reduce((s,i)=>s+i.qty,0);
    const addr = (f.get('addr')||'');
    const okCity = addr.includes('台中市');
    if(totalQty<5 || !okCity) return alert('到府服務限台中市且需滿 5 箱，請確認數量與地址。');
  }

  const payload={
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr: method==='PICKUP' ? '自取（台中市石岡區石岡街61號）' : (f.get('addr')||''),
    ship: shipLabel,
    remark:f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND_TAG,
    shipMeta:{ method }
  };

  const payMethod = (document.querySelector('input[name="pay"]:checked')?.value) || 'LINEPAY';
  const btn=document.getElementById('submitBtn'); const resBox=document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; resBox.textContent='';

  try{
    // 先建立訂單
    const r1=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d1=await r1.json();
    if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
    const orderNo=d1.order_no;

    if(payMethod==='LINEPAY'){
      await goLinePay(orderNo, payload.summary.total, payload.items);
      return; // 導轉
    }
    if(payMethod==='BANK'){
      resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>
        請於 24 小時內完成匯款並回報後五碼。
        <div class="card" style="padding:10px;margin-top:8px">
          <div><b>${CONFIG.BANK.name}</b></div>
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>
        </div>`;
    }
    if(payMethod==='CASH_PICKUP'){
      resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>
        您選擇 <b>自取（現金）</b>，到門市時請報訂單編號即可。`;
    }

    cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
  }catch(e){ resBox.textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

async function goLinePay(orderNo, amount, items){
  const body={ orderNo, amount, currency:CONFIG.PAY.currency, items };
  const r=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_request', { method:'POST', body: JSON.stringify(body) });
  const d=await r.json();
  if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
  localStorage.setItem('gx_lp_orderNo', orderNo);
  localStorage.setItem('gx_lp_amount', String(amount));
  location.href = d.paymentUrl; // 導轉到 LINE Pay
}

// LINE Pay 回傳確認
(async function handleLinePayReturn(){
  const params=new URLSearchParams(location.search);
  if(params.get('lp')==='return'){
    const orderNo=localStorage.getItem('gx_lp_orderNo');
    const amount=Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId=params.get('transactionId');
    if(orderNo && transactionId){
      try{
        const body={ orderNo, transactionId, amount, currency:CONFIG.PAY.currency };
        const r=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_confirm', { method:'POST', body: JSON.stringify(body) });
        const d=await r.json();
        if(d.ok){ showToast('付款成功，感謝支持！'); cart.length=0; saveCart(); renderCart(); localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount'); }
        else{ alert('付款確認失敗：'+(d.msg||'')); }
      }catch(e){ alert('付款確認錯誤：'+e.message); }
    }
  }
})();

/**************
 * 條款同意：捲到底才可勾
 **************/
(function setupPolicy(){
  const det = document.getElementById('policy');
  const agree = document.getElementById('agree');
  const enableIfBottom = ()=>{ const sc = det.scrollTop + det.clientHeight; const need = det.scrollHeight - 10; if(sc >= need){ agree.disabled = false; } };
  det.addEventListener('toggle', ()=>{ if(det.open){ det.focus(); }}); det.addEventListener('scroll', enableIfBottom, {passive:true});
})();

/**************
 * 訂單查詢（保留）
 **************/
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target);
  const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard');
  const printBtn=document.getElementById('printBtn');
  card.style.display='block'; card.innerHTML='查詢中…'; printBtn.style.display='none';
  try{
    const url=CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no);
    const r=await fetch(url); const data=await r.json();
    if(data.ok){
      const s=data.status||'（未提供狀態）';
      const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—';
      const shipDate=data.shipDate?dateOnly(data.shipDate):'—';
      const trackNo=data.trackingNo||'—';
      const hctLink=`<a href="https://www.hct.com.tw/search/searchgoods_n.aspx" target="_blank" rel="noopener">新竹貨運查詢</a>`;
      const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h3 style="margin:0">訂單查詢結果</h3>
          <div class="note">${new Date().toLocaleString()}</div>
        </div>
        <div class="line" style="margin:10px 0"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${s}</div>
        <div><b>出貨日期：</b>${shipDate}</div>
        <div><b>物流單號：</b>${trackNo}</div>
        <div><b>物流查詢：</b>${hctLink}</div>
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

/**************
 * 初始化
 **************/
function renderCartFirst(){
  document.getElementById('freeShipText').textContent = 'NT$ ' + CONFIG.FREE_SHIP_THRESHOLD.toLocaleString();
  setShipMethod(getShipMethod());
  renderCart();
}
function mountImages(){
  document.getElementById('img-pongan').src = CONFIG.IMAGES.PRODUCT;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.PRODUCT;
}
mountImages();
renderCartFirst();
loadForm();

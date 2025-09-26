/*****************
 * 設定與資料區  *
 *****************/
const CONFIG = {
  BRAND_TAG: "柑心果園",
  // 這裡使用你現有的 GAS：若未來重新部署，請更新為新網址
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' },
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"),
    GENERIC10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png")
  },
  PRICES: {
    // 價格集中在這裡，未來只改這裡即可
    PONGAN: { "10台斤": { "23A": 750, "25A": 780, "27A": 820, "30A": 880 } },
    MAOGAO: { "10台斤": { "23A": 720, "25A": 760, "27A": 800, "30A": 860 } }
  },
  INVENTORY: {
    // 你可改為實際庫存或串後端回填
    "PON10-23A":{sold:50, stock:200}, "PON10-25A":{sold:122, stock:678}, "PON10-27A":{sold:66, stock:734}, "PON10-30A":{sold:55, stock:745},
    "MAO10-23A":{sold:72, stock:178}, "MAO10-25A":{sold:355, stock:545}, "MAO10-27A":{sold:102, stock:698}, "MAO10-30A":{sold:78, stock:722}
  },
  STATUS: {
    "PON10-23A":"preorder","PON10-25A":"preorder","PON10-27A":"preorder","PON10-30A":"preorder",
    "MAO10-23A":"preorder","MAO10-25A":"preorder","MAO10-27A":"preorder","MAO10-30A":"preorder"
  }
};

// 商品（只保留 10 台斤）
const PRODUCTS = {
  PONGAN: { idPrefix:'PON10', section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`PON10-${s}` },
  MAOGAO: { idPrefix:'MAO10', section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(s)=>`MAO10-${s}` },
};

// LocalStorage Keys
const LS = { cart:'gx_cart', shipMethod:'gx_ship_method', form:'gx_form' };

/*****************
 * 小工具         *
 *****************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (section,weight,size)=> CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id] || 'normal'; }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
function go(e,id){ if(e) e.preventDefault(); const el=document.getElementById(id); if(!el) return; const navH=document.querySelector('.subnav')?.offsetHeight||0; const y=el.getBoundingClientRect().top+window.scrollY-navH-6; window.scrollTo({top:y,behavior:'smooth'}); }

/*****************
 * 初始視覺與資料 *
 *****************/
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };

function initVisual(){
  // Hero 背景
  const hero = document.getElementById('hero');
  hero && (hero.style.backgroundImage = `url("${CONFIG.IMAGES.HERO}")`);
  // 兩張品種照
  document.getElementById('img-pongan').src = CONFIG.IMAGES.PONGAN || CONFIG.IMAGES.GENERIC10;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.MAOGAO || CONFIG.IMAGES.GENERIC10;
  // 規格籤
  renderSpecChips('PONGAN');
  renderSpecChips('MAOGAO');
  // 評論跑馬燈
  renderReviews();
}

/*****************
 * 規格籤與加入購物車
 *****************/
function renderSpecChips(kind){
  const conf=PRODUCTS[kind];
  const rail=document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  const price = priceOf(conf.section, conf.weight, SELECTED[kind]);
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(price);
  const pid = conf.getId(SELECTED[kind]);
  const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock} 箱`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); }

function addSelected(kind){
  const conf=PRODUCTS[kind]; const size=SELECTED[kind];
  const pid=conf.getId(size); const price=priceOf(conf.section, conf.weight, size);
  const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
  addToCart(pid,title,price,conf.weight,size, conf.section);
}

/*****************
 * 購物車         *
 *****************/
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); }
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open', !!open); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }
function toggleAdmin(open){ document.getElementById('adminDrawer').classList.toggle('open', !!open); if(open) renderAdmin(); }

function addToCart(pid,title,price,weight,size,section){
  if(statusOf(pid)==='soldout'){ showToast('此品項已售完'); return; }
  const existed = cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({ id:pid, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); bumpFab();
  showToast(statusOf(pid)==='preorder' ? '已加入預購清單' : '已加入購物車');
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }

function getShipMethod(){ return localStorage.getItem(LS.shipMethod)||'HOME'; }
function setShipMethod(m){
  if(m==='CVS'){
    const ok = cart.length===1 && cart[0].weight==='10台斤' && cart[0].qty===1;
    if(!ok){ alert('超商取貨限「單一 10 台斤 × 1 箱」。請調整購物車數量後再選擇。'); m='HOME'; }
  }
  localStorage.setItem(LS.shipMethod,m);
  document.getElementById('shipHomeBtn').className = (m==='HOME') ? 'btn' : 'btn-ghost';
  document.getElementById('shipCvsBtn').className  = (m==='CVS')  ? 'btn' : 'btn-ghost';
  renderCart();
}
function calc(){
  const method=getShipMethod();
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  let shipping=0; if(method==='CVS') shipping=0; else shipping=(subtotal>=CONFIG.FREE_SHIP_THRESHOLD||cart.length===0)?0:CONFIG.SHIPPING;
  return {subtotal,shipping,total:subtotal+shipping};
}
function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){
    list.innerHTML='<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>';
  }else{
    list.innerHTML=cart.map((c,i)=>`
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
  document.getElementById('subtotal').textContent=currency(subtotal);
  document.getElementById('shipping').textContent=currency(shipping);
  document.getElementById('total').textContent=currency(total);
  document.getElementById('fabCount').textContent=cart.reduce((s,i)=>s+i.qty,0);

  const method=getShipMethod();
  document.getElementById('shipLabel').textContent = method==='CVS'? '運費（超商取貨｜免運）':'運費（宅配）';
  const shipSel=document.querySelector('select[name="ship"]'); if(shipSel) shipSel.value = method==='CVS' ? '超商取貨' : '宅配';
  document.getElementById('homeFields').style.display = (method==='HOME') ? 'block':'none';
  document.getElementById('cvsFields').style.display  = (method==='CVS')  ? 'block':'none';
  document.querySelector('input[name="addr"]')?.toggleAttribute('required', method==='HOME');
}

/*****************
 * 下單與付款     *
 *****************/
function saveForm(){ const f=document.getElementById('orderForm'); const obj=Object.fromEntries(new FormData(f)); obj.shipMethod=getShipMethod(); localStorage.setItem(LS.form, JSON.stringify(obj)); }
function loadForm(){ try{ const s=localStorage.getItem(LS.form); if(!s) return; const obj=JSON.parse(s); const f=document.getElementById('orderForm'); for(const k in obj){ if(f[k]) f[k].value=obj[k]; } setShipMethod(obj.shipMethod||'HOME'); }catch{} }

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀「物流與退貨說明」並勾選同意'); return; }

  const f=new FormData(ev.target);
  f.set('ship', getShipMethod()==='CVS' ? '超商取貨' : f.get('ship'));
  const method=getShipMethod();
  if(method==='CVS'){
    const ok = cart.length===1 && cart[0].weight==='10台斤' && cart[0].qty===1;
    if(!ok){ alert('超商取貨限「單一 10 台斤 × 1 箱」。'); return; }
  }
  for(const key of ['name','phone','email']) if(!f.get(key)) return alert('請完整填寫訂單資料');
  if(method==='HOME' && !f.get('addr')) return alert('請填寫宅配地址');

  const payload={
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr: method==='CVS' ? `${f.get('cvsBrand')||''} ${f.get('cvsStore')||''}（超商取貨）` : (f.get('addr')||''),
    ship: method==='CVS' ? '超商取貨' : f.get('ship'),
    remark:f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(), brand: CONFIG.BRAND_TAG,
    shipMeta:{method, cvsBrand:f.get('cvsBrand')||'', cvsStore:f.get('cvsStore')||''}
  };

  const payMethod = (document.querySelector('input[name="pay"]:checked')?.value) || 'LINEPAY';
  const btn=document.getElementById('submitBtn'); const resBox=document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; resBox.textContent='';

  try{
    // 1) 建立訂單（沿用你的 Google Apps Script）
    const r1=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d1=await r1.json();
    if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
    const orderNo=d1.order_no;

    if(payMethod==='LINEPAY'){
      // 2) 送 LINE Pay request（由 GAS 對 LINE Pay v3 發起）
      const returnUrl = location.href.split('?')[0]; // 回到同一頁帶 lp=return
      const body={ orderNo, amount:payload.summary.total, currency:CONFIG.PAY.currency, items:payload.items, returnUrl };
      const r=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_request', { method:'POST', body: JSON.stringify(body) });
      const d=await r.json();
      if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
      // 導轉去 LINE Pay
      localStorage.setItem('gx_lp_orderNo', orderNo);
      localStorage.setItem('gx_lp_amount', String(payload.summary.total));
      location.href = d.paymentUrl;
      return; // 導轉後就結束
    }else{
      // 匯款：立即顯示帳號
      resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>\
        請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。\
        <div class="card" style="padding:10px; margin-top:8px">\
          <div><b>${CONFIG.BANK.name}</b></div>\
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>\
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>\
        </div>`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
    }
  }catch(e){ resBox.textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

// 處理 LINE Pay return（回到前端頁面後，前端呼叫 GAS confirm）
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
        if(d.ok){
          showToast('付款成功，感謝支持！');
          cart.length=0; saveCart(); renderCart();
          localStorage.removeItem('gx_lp_orderNo');
          localStorage.removeItem('gx_lp_amount');
        }else{
          alert('付款確認失敗：'+(d.msg||'')); 
        }
      }catch(e){
        alert('付款確認錯誤：'+e.message);
      }
    }
    // 清掉網址參數避免重複確認
    const clean = location.href.split('?')[0];
    history.replaceState({}, '', clean);
  }
})();

/*****************
 * 訂單查詢       *
 *****************/
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target);
  const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard');
  const printBtn=document.getElementById('printBtn');
  card.style.display='block';
  card.innerHTML='查詢中…';
  printBtn.style.display='none';
  try{
    const url=CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no);
    const r=await fetch(url);
    const data=await r.json();
    if(data.ok){
      const s=data.status||'（未提供狀態）';
      const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—';
      const shipDate=data.shipDate?dateOnly(data.shipDate):'—';
      const trackNo=data.trackingNo||'—';
      const hctLink=`<a href="https://www.hct.com.tw/search/searchgoods_n.aspx" target="_blank" rel="noopener">新竹貨運查詢</a>`;
      const cvsQuery=`<a href="https://eservice.7-11.com.tw/e-tracking/search.aspx" target="_blank" rel="noopener">7-11</a> ｜ <a href="https://fmec.famiport.com.tw/FP_Entrance/QueryBox" target="_blank" rel="noopener">全家</a>`;
      const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—';

      card.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px">
          <h3 style="margin:0">訂單查詢結果</h3>
          <div class="note">${new Date().toLocaleString()}</div>
        </div>
        <div class="line"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${s}</div>
        <div><b>出貨日期：</b>${shipDate}</div>
        <div><b>物流單號：</b>${trackNo}</div>
        <div><b>物流查詢：</b>${hctLink}</div>
        <div><b>超商查詢：</b>${cvsQuery}</div>
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
 * 門市查詢連結   *
 *****************/
function updateCvsLink(){
  const brand = document.querySelector('select[name="cvsBrand"]').value;
  const a = document.getElementById('cvsFinderLink');
  if(brand==='全家'){
    a.href = 'https://www.family.com.tw/marketing/inquiry.aspx';
    a.textContent = '開啟 全家 門市查詢（新視窗）';
  }else{
    a.href = 'https://emap.pcsc.com.tw/';
    a.textContent = '開啟 7-11 門市查詢（新視窗）';
  }
}

/*****************
 * 好評跑馬燈     *
 *****************/
function maskName(name){ const s=String(name||'').trim(); if(s.length<=2) return s[0]+'○'; return s[0]+'○'.repeat(s.length-2)+s[s.length-1]; }
function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function seasonalDate(){ const now=new Date(); const y=now.getFullYear(); const start=(now.getMonth()+1)>=11?y:y-1; const a=new Date(start,10,1).getTime(), b=Math.min(now.getTime(), new Date(start+1,2,31).getTime()); const t=a+Math.random()*(b-a); const d=new Date(t); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }
function genReviews(n=100){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","翔","修","均","凱"];
  const c5=["好甜又多汁，家人超愛","果香乾淨，剝皮就香","顆顆飽滿，回購中","皮薄好剝，小孩一直拿","冰過更好吃","價格實在，品質很好","收到幾天就吃光","香味清新不膩口"];
  const c4=["甜度高，幾顆略小但整體很棒","稍微酸一點更開胃","品質穩定","外皮薄好剝，舒服"];
  const c3=["味道不錯挺甜的","清爽順口","香氣宜人，家人說不錯"];
  const sizes=["23A","25A","27A","30A"];
  const arr=[];
  for(let i=0;i<n;i++){
    const name=maskName(randPick(last)+randPick(given)+randPick(given));
    let star=5, text=randPick(c5);
    const m=i%50; if(m===0){star=3;text=randPick(c3);} else if([10,30,40].includes(m)){star=4;text=randPick(c4);}
    arr.push({name, date: seasonalDate(), spec:`10台斤｜${randPick(sizes)}`, stars:star, text});
  }
  arr.sort((a,b)=> a.date<b.date?1:-1);
  return arr;
}
function starHtml(n){ let s=""; for(let i=0;i<5;i++) s+=`<span class="star ${i<n?'on':'off'}">★</span>`; return s; }
function renderReviews(){
  const list=genReviews(100);
  const card=r=>`<div class="rv"><div style="display:flex; gap:10px; align-items:center"><span>🍊</span><b>${r.name}</b></div><div class="stars">${starHtml(r.stars)}</div><div class="note">購買：${r.spec}｜${r.date}</div><p style="margin:4px 0 0">${r.text}</p></div>`;
  const html=list.map(card).join("");
  const track=document.getElementById('rvTrack');
  track.innerHTML=html+html; // 雙份無縫循環
  requestAnimationFrame(()=>{
    const single=track.scrollHeight/2;
    const speed=90; // px/s
    const dur=Math.max(10, Math.round(single/speed));
    track.style.setProperty('--rv-dur', dur+'s');
    track.classList.add('anim');
  });
}

/*****************
 * 條款（需捲底才可勾） *
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
 * Admin：RAW 轉換 *
 *****************/
function renderAdmin(){
  const box=document.getElementById('adminBody');
  box.innerHTML = `
    <h3>GitHub RAW 連結轉換器</h3>
    <p class="muted">貼上 <b>GitHub 檔案頁</b>網址（例如：<code>https://github.com/user/repo/blob/main/img.jpg</code>），按【轉換】得到 <b>raw.githubusercontent.com</b> 直接連結。</p>
    <div class="label">貼上 GitHub 檔案網址</div>
    <input id="rawInput" class="input" placeholder="例如：https://github.com/user/repo/blob/main/assets/photo.jpg">
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px">
      <button class="btn-ghost" type="button" onclick="pasteRawFromClipboard()">一鍵貼上剪貼簿</button>
      <button class="btn" type="button" onclick="convertToRaw()">轉換</button>
      <button class="btn-ghost" type="button" onclick="copyRaw()">複製 RAW 連結</button>
    </div>
    <div id="rawOutput" class="card" style="display:none; padding:12px; margin-top:10px"></div>
  `;
}
async function pasteRawFromClipboard(){ try{ const txt=await navigator.clipboard.readText(); if(!txt) return alert('剪貼簿沒有內容'); document.getElementById('rawInput').value=txt.trim(); }catch(e){ alert('無法讀取剪貼簿：'+e.message); } }
function convertToRaw(){ const input=document.getElementById('rawInput'); let url=(input.value||'').trim(); if(!url) return alert('請先貼上網址'); const raw=toRaw(url); const out=document.getElementById('rawOutput'); out.style.display='block'; out.innerHTML=`<div style="display:flex; justify-content:space-between; align-items:center"><b>RAW 連結</b><button class="btn-ghost" onclick="copyRaw()">複製</button></div><div class="line"></div><div style="word-break:break-all">${raw}</div>`; input.value=raw; }
async function copyRaw(){ const raw=(document.getElementById('rawInput').value||'').trim(); if(!raw) return alert('沒有可複製的連結'); try{ await navigator.clipboard.writeText(raw); alert('已複製 RAW 連結'); }catch(e){ alert('複製失敗：'+e.message); } }

/*****************
 * 啟動           *
 *****************/
function updateCvsLinkOnLoad(){ try{ updateCvsLink(); }catch{} }
function init(){
  initVisual();
  setShipMethod(getShipMethod());
  renderCart();
  loadForm();
  updateCvsLinkOnLoad();
  document.getElementById('orderForm').addEventListener('input', saveForm);
}
document.addEventListener('DOMContentLoaded', init);

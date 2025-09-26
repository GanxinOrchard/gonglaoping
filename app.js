/* app.js — GanxinOrchard FINAL */
(() => {
  'use strict';

  // ===== 工具 =====
  const $ = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn)=> el && el.addEventListener(ev, fn);
  const currency = n => `NT$ ${(n||0).toLocaleString()}`;
  const toRaw = (u)=> !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/'));
  const ioIn = (el, ratio=0.2, cls='in')=>{
    if(!el) return;
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ el.classList.add(cls); io.unobserve(el); } });
    },{threshold:ratio});
    io.observe(el);
  };

  // ===== 設定（可改）=====
  const CONFIG = {
    BRAND_TAG: "柑心果園",
    GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
    PAY: { currency:'TWD' },
    SHIPPING: 160,
    FREE_SHIP_THRESHOLD: 1800,
    BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
    IMAGES: {
      LOGO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png"),
      HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
      PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
      MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png"),
      PRODUCT10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
      STORY1: "https://images.unsplash.com/photo-1604908554046-1054a5d4e99f?q=80&w=1200&auto=format&fit=crop",
      STORY2: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=1200&auto=format&fit=crop",
      STORY3: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
      CLOSE1: "https://images.unsplash.com/photo-1547517023-1262fbb5349b?q=80&w=1200&auto=format&fit=crop",
      CLOSE2: "https://images.unsplash.com/photo-1586201375761-83865001e31b?q=80&w=1200&auto=format&fit=crop",
      CLOSE3: "https://images.unsplash.com/photo-1615485922355-15b056f18b36?q=80&w=1200&auto=format&fit=crop",
      CLOSE4: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop"
    },
    PRICES: {
      PONGAN: {"10台斤": {"23A": 750, "25A": 780, "27A": 820, "30A": 880}},
      MAOGAO: {"10台斤": {"23A": 720, "25A": 760, "27A": 800, "30A": 860}}
    },
    // 直徑參考（可自行調整）
    SIZE_DIAMETER_CM: { "23A":"約 8.6–9.0 cm", "25A":"約 8.1–8.5 cm", "27A":"約 7.6–8.0 cm", "30A":"約 7.0–7.5 cm" },
    INVENTORY: {
      "PON10-23A":{sold:50, stock:200},"PON10-25A":{sold:122, stock:678},"PON10-27A":{sold:66, stock:734},"PON10-30A":{sold:55, stock:745},
      "MAO10-23A":{sold:72, stock:178},"MAO10-25A":{sold:355, stock:545},"MAO10-27A":{sold:102, stock:698},"MAO10-30A":{sold:78, stock:722}
    },
    STATUS: {
      "PON10-23A":"preorder","PON10-25A":"preorder","PON10-27A":"preorder","PON10-30A":"preorder",
      "MAO10-23A":"preorder","MAO10-25A":"preorder","MAO10-27A":"preorder","MAO10-30A":"preorder"
    }
  };

  // 商品設定（保留 10 台斤）
  const PRODUCTS = {
    PONGAN:{ section:'PONGAN', title:'椪柑', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`PON10-${s}` },
    MAOGAO:{ section:'MAOGAO', title:'茂谷', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:s=>`MAO10-${s}` }
  };
  const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };

  // ===== SEO JSON-LD =====
  function injectSEO(){
    const ld=[];
    const url=location.origin+location.pathname;
    ld.push({
      "@context":"https://schema.org","@type":"Organization",
      "name":"柑心果園","url":url,"logo":CONFIG.IMAGES.LOGO,
      "sameAs":["https://www.facebook.com/profile.php?id=61581488901343"]
    });
    ld.push({
      "@context":"https://schema.org","@type":"WebSite",
      "name":"柑心果園｜公老坪椪柑・東勢茂谷","url":url,
      "potentialAction":{"@type":"SearchAction","target":url+"?q={search_term_string}","query-input":"required name=search_term_string"}
    });
    ['PONGAN','MAOGAO'].forEach(kind=>{
      const name=(kind==='PONGAN'?'椪柑':'茂谷')+"｜10台斤｜25A";
      const price=CONFIG.PRICES[kind]["10台斤"]["25A"];
      const image=CONFIG.IMAGES[kind];
      ld.push({"@context":"https://schema.org","@type":"Product","name":name,"brand":{"@type":"Brand","name":"柑心果園"},
        "image":image,"description":name,"offers":{"@type":"Offer","priceCurrency":CONFIG.PAY.currency,"price":String(price),"availability":"http://schema.org/PreOrder","url":url+"#shop"}});
    });
    const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(ld); document.head.appendChild(s);
  }

  // ===== 導覽 =====
  function initNav(){
    const ham=$('#hamburger'), nav=$('#mainNav');
    on(ham,'click', ()=> nav.classList.toggle('show'));
    // Logo 與 Hero 背景
    $('#brandLogo').src = CONFIG.IMAGES.LOGO;
    $('#footLogo').src  = CONFIG.IMAGES.LOGO;
    $('#hero').style.backgroundImage = `url('${CONFIG.IMAGES.HERO}')`;
  }

  // ===== 品牌故事輪播 =====
  function initStory(){
    const map={story1:CONFIG.IMAGES.STORY1,story2:CONFIG.IMAGES.STORY2,story3:CONFIG.IMAGES.STORY3};
    $$('#story .story-bg').forEach(bg=>{ const key=bg.dataset.img; bg.style.backgroundImage=`url('${map[key]}')`; });
    // dots
    const car=$('#storyCarousel'); const dots=$('#storyDots');
    if(!car||!dots) return;
    const items=$$('#storyCarousel .story-card');
    dots.innerHTML = items.map((_,i)=>`<button class="dot${i===0?' on':''}"></button>`).join('');
    const dotEls=$$('#storyDots .dot');
    const sync=()=>{
      const idx=Math.round(car.scrollLeft / (car.clientWidth*0.85)); dotEls.forEach((d,i)=>d.classList.toggle('on',i===idx));
    };
    on(car,'scroll', ()=> requestAnimationFrame(sync));
  }

  // ===== 三大信任點滑入 =====
  function initKPI(){
    $$('#why .kpi-card').forEach(el=> ioIn(el, .2, 'in'));
  }

  // ===== 甘心量表 dots 渲染 + 尺寸顯示 =====
  function renderDots(){
    $$('.dots').forEach(d=>{
      const onCount = Number(d.dataset.on||0);
      d.style.background =
        `radial-gradient(circle at 5px 5px, var(--brand) 5px, transparent 6px) 0 0/14px 14px repeat-x,
         radial-gradient(circle at 5px 5px, #e5e7eb 5px, transparent 6px) 0 0/14px 14px repeat-x`;
      // 以遮罩方式只顯示前 onCount 顆
      const total=5, gap=4, dot=10, cell=dot+gap, width=cell*total-gap;
      const onW = cell*onCount-gap;
      d.style.webkitMaskImage = `linear-gradient(90deg,#000 ${onW}px,transparent ${onW}px)`;
      d.style.maskImage = `linear-gradient(90deg,#000 ${onW}px,transparent ${onW}px)`;
      d.style.width = width+'px';
    });
    // 初始尺寸值
    $('#size-pongan').textContent = CONFIG.SIZE_DIAMETER_CM[SELECTED.PONGAN] || '—';
    $('#size-maogao').textContent = CONFIG.SIZE_DIAMETER_CM[SELECTED.MAOGAO] || '—';
  }

  // ===== 規格籤 =====
  function renderSpecChips(kind){
    const group = PRODUCTS[kind];
    const rail = $('#spec-'+kind.toLowerCase());
    rail.innerHTML = group.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" data-size="${s}">${group.weight}｜${s}</button>`).join('');
    $$('#spec-'+kind.toLowerCase()+' .spec').forEach(btn=>{
      on(btn,'click', ()=>{
        $$('#spec-'+kind.toLowerCase()+' .spec').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        SELECTED[kind] = btn.dataset.size;
        // 更新價格／庫存／尺寸顯示
        refreshVarietyMeta(kind);
        $('#size-'+kind.toLowerCase()).textContent = CONFIG.SIZE_DIAMETER_CM[SELECTED[kind]] || '—';
      });
    });
  }

  function refreshVarietyMeta(kind){
    const conf=PRODUCTS[kind], weight=conf.weight, size=SELECTED[kind], section=conf.section;
    const pid = conf.getId(size);
    const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
    const price = CONFIG.PRICES[section][weight][size] || 0;
    const priceEl = $('#price-'+kind.toLowerCase());
    priceEl.innerHTML = `<strong>${currency(price)}</strong><span class="note">已售出 ${inv.sold}｜剩 ${inv.stock}</span>`;
  }

  // ===== 產品圖片 =====
  function initVarietyImages(){
    $('#img-pongan').src = CONFIG.IMAGES.PONGAN || CONFIG.IMAGES.PRODUCT10;
    $('#img-maogao').src = CONFIG.IMAGES.MAOGAO || CONFIG.IMAGES.PRODUCT10;
  }

  // ===== 果實近拍 1:1 圖庫 =====
  function initCloseups(){
    const g=$('#closeupGallery'); if(!g) return;
    const map={
      close1:CONFIG.IMAGES.CLOSE1, close2:CONFIG.IMAGES.CLOSE2,
      close3:CONFIG.IMAGES.CLOSE3, close4:CONFIG.IMAGES.CLOSE4
    };
    $$('#closeupGallery img').forEach(img=> img.src = map[img.dataset.src]);
  }

  // ===== 側邊「買過都說讚」 =====
  function initPraise(){
    const side=$('#praiseTrack'), mini=$('#miniReviews');
    const pills = Array.from({length:10},()=>`<div class="praise">買過都說讚</div>`).join('');
    if(side) side.innerHTML = pills + pills;
    if(mini) mini.innerHTML = pills;
  }

  // ===== 流程圓點切換 =====
  function initFlow(){
    const dots=$$('#flow .flow-dot'); const cards=$$('#flow .flow-card');
    const set=(i)=>{ dots.forEach((d,k)=>d.classList.toggle('on',k===i)); cards.forEach((c,k)=>c.style.display = (k===i?'block':'none')); };
    dots.forEach((d,i)=> on(d,'click',()=> set(i)));
    set(0);
  }

  // ===== 購物車 =====
  const LS_CART='gx_cart';
  const cart = (()=>{ try{const s=localStorage.getItem(LS_CART); return s? JSON.parse(s):[] }catch{ return [] } })();
  const saveCart=()=> localStorage.setItem(LS_CART, JSON.stringify(cart));
  const calc=()=>{
    const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
    const shipping = (!cart.length || subtotal>=CONFIG.FREE_SHIP_THRESHOLD) ? 0 : CONFIG.SHIPPING;
    return {subtotal, shipping, total: subtotal+shipping};
  };
  function renderCart(){
    const list=$('#cartList');
    if(!cart.length){
      list.innerHTML = `<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>`;
    }else{
      list.innerHTML = cart.map((c,i)=>`
        <div class="row2 cart-row">
          <div>
            <div><strong>${c.title}</strong></div>
            <div class="note">${currency(c.price)} × ${c.qty}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
            <button class="btn btn-ghost" onclick="mutateQty(${i},-1)">–</button>
            <span>${c.qty}</span>
            <button class="btn btn-ghost" onclick="mutateQty(${i},1)">＋</button>
          </div>
        </div>`).join('');
    }
    const {subtotal,shipping,total} = calc();
    $('#subtotal').textContent = currency(subtotal);
    $('#shipping').textContent = currency(shipping);
    $('#total').textContent     = currency(total);
    $('#fabCount').textContent  = cart.reduce((s,i)=>s+i.qty,0);
    $('#freeShipText').textContent = 'NT$ ' + (CONFIG.FREE_SHIP_THRESHOLD||0).toLocaleString();
  }
  window.mutateQty = (i,d)=>{ cart[i].qty+=d; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); };

  function addSelected(kind){
    const conf=PRODUCTS[kind]; const size=SELECTED[kind];
    const pid=conf.getId(size); const price=CONFIG.PRICES[conf.section][conf.weight][size]||0;
    const title=(kind==='PONGAN'?'椪柑':'茂谷')+`｜${conf.weight}｜${size}`;
    const existed = cart.find(x=>x.id===pid);
    if(existed) existed.qty++;
    else cart.push({ id:pid, title, price, qty:1, weight:conf.weight, size, section:conf.section });
    saveCart(); renderCart(); toast('已加入購物車');
  }
  window.addSelected = addSelected;

  function initCartUI(){
    const fab=$('#cartFab'), drawer=$('#cartDrawer'), close=$('#closeCart');
    on(fab,'click', ()=> drawer.classList.add('open'));
    on(close,'click', ()=> drawer.classList.remove('open'));
  }

  // ===== 下單 / 付款 =====
  function initSubmit(){
    const det=$('#policy'), agree=$('#agree');
    if(det && agree){
      const enable=()=>{ const sc=det.scrollTop+det.clientHeight, need=det.scrollHeight-10; if(sc>=need) agree.disabled=false; };
      on(det,'toggle', ()=>{ if(det.open){ det.focus(); } });
      on(det,'scroll', enable, {passive:true});
    }

    const form=$('#orderForm');
    if(!form) return;
    on(form,'submit', async (ev)=>{
      ev.preventDefault();
      if(!cart.length) return alert('購物車是空的');
      if(agree && !agree.checked) return alert('請先閱讀「物流與退貨說明」並勾選同意');

      const f=new FormData(form);
      for(const k of ['name','phone','email','addr']){
        if(!f.get(k)) return alert('請完整填寫：姓名/手機/Email/地址');
      }
      const summary=calc();
      const payload={
        ts:new Date().toISOString(),
        name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
        addr:f.get('addr')||'', ship:'宅配',
        remark:f.get('remark')||'',
        items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
        summary, brand: CONFIG.BRAND_TAG, shipMeta:{method:'HOME'}
      };

      const btn=$('#submitBtn'), res=$('#result');
      btn.disabled=true; btn.textContent='處理中…'; res.textContent='';
      try{
        // 建立訂單
        const r1=await fetch(CONFIG.GAS_ENDPOINT,{method:'POST',body:JSON.stringify(payload)}); const d1=await r1.json();
        if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
        const orderNo=d1.order_no;
        const pay=(form.querySelector('input[name="pay"]:checked')||{}).value||'LINEPAY';
        if(pay==='LINEPAY'){
          await goLinePay(orderNo, payload); // 導轉離站
          return;
        }else{
          // 匯款：顯示帳號於結果區
          res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。
          <div class="card" style="padding:10px;margin-top:8px">
            <div><b>${CONFIG.BANK.name}</b></div>
            <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
            <div>帳號：<b>${CONFIG.BANK.no}</b></div>
          </div>`;
          // 清空購物車
          cart.length=0; saveCart(); renderCart();
        }
      }catch(e){ res.textContent='送出失敗：'+e.message; }
      finally{ btn.disabled=false; btn.textContent='送出訂單'; }
    });
  }

  async function goLinePay(orderNo, payload){
    const amount=payload.summary.total;
    try{
      const r=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_request',{method:'POST',body:JSON.stringify({
        orderNo, amount, currency:CONFIG.PAY.currency, items:payload.items
      })});
      const d=await r.json();
      if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
      localStorage.setItem('gx_lp_orderNo', orderNo);
      localStorage.setItem('gx_lp_amount', String(amount));
      location.href = d.paymentUrl;
    }catch(e){ alert('LINE Pay 建立失敗：'+e.message); }
  }

  async function handleLinePayReturn(){
    const q=new URLSearchParams(location.search);
    if(q.get('lp')!=='return') return;
    const orderNo=localStorage.getItem('gx_lp_orderNo'); const amount=Number(localStorage.getItem('gx_lp_amount')||0);
    const transactionId=q.get('transactionId'); if(!orderNo||!transactionId) return;
    try{
      const r=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_confirm',{method:'POST',body:JSON.stringify({
        orderNo, transactionId, amount, currency:CONFIG.PAY.currency
      })});
      const d=await r.json();
      if(d.ok){
        toast('付款成功，感謝支持！');
        localStorage.removeItem('gx_lp_orderNo'); localStorage.removeItem('gx_lp_amount');
        // 清空購物車
        localStorage.setItem(LS_CART,'[]');
      }else alert('付款確認失敗：'+(d.msg||''));
    }catch(e){ alert('付款確認錯誤：'+e.message); }
  }

  // ===== 訂單查詢 =====
  function initQuery(){
    const drawer=$('#queryDrawer');
    window.toggleQuery = (open)=> drawer.classList.toggle('open', !!open);
    const form=$('#queryForm'); if(!form) return;
    on(form,'submit', async (ev)=>{
      ev.preventDefault();
      const no=(new FormData(form).get('orderNo')||'').trim();
      const card=$('#queryCard'); card.style.display='block'; card.textContent='查詢中…';
      try{
        const r=await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no)); const d=await r.json();
        if(d.ok){
          const date = v => v ? new Date(v).toLocaleDateString() : '—';
          const items = Array.isArray(d.items)? d.items.map(i=>`${i.title} × ${i.qty}`).join('、'):'—';
          card.innerHTML = `<div class="row"><h3 style="margin:0">訂單查詢結果</h3><span class="note">${new Date().toLocaleString()}</span></div><div class="line"></div>
          <div><b>訂單編號：</b>${no}</div>
          <div><b>目前狀態：</b>${d.status||'—'}</div>
          <div><b>出貨日期：</b>${date(d.shipDate)}</div>
          <div><b>物流單號：</b>${d.trackingNo||'—'}</div>
          <div><b>金額：</b>${d.total?currency(d.total):'—'}</div>
          <div><b>品項：</b>${items}</div>`;
        }else card.textContent='查無此訂單編號';
      }catch(e){ card.textContent='查詢失敗：'+e.message; }
    });
  }

  // ===== LINE Pay 樣式開關（選到時讓頁面帶綠）=====
  function initPayStyle(){
    const radios=$$('input[name="pay"]');
    const apply=()=> document.body.classList.toggle('linepay-active',
      (document.querySelector('input[name="pay"]:checked')||{}).value==='LINEPAY');
    radios.forEach(r=> on(r,'change',apply));
    apply();
  }

  // ===== 評價小條（速度舒適）=====
  function initMiniReviews(){
    // 已在 initPraise 建立，這裡可微調速度（用 CSS transition 不跑馬燈，簡單穩定）
    // 如需跑馬燈可加 animation；此版固定 chips 即可。
  }

  // ===== 回到頂部 =====
  function initBackToTop(){
    const btn=$('#backToTop');
    on(btn,'click', e=>{e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'});});
  }

  // ===== Toast =====
  function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
  window.toast = toast;

  // ===== 啟動 =====
  document.addEventListener('DOMContentLoaded', ()=>{
    injectSEO();
    initNav();
    initStory();
    initKPI();
    initVarietyImages();
    renderDots();
    renderSpecChips('PONGAN'); refreshVarietyMeta('PONGAN');
    renderSpecChips('MAOGAO'); refreshVarietyMeta('MAOGAO');
    initCloseups();
    initPraise();
    initFlow();
    initCartUI();
    renderCart();
    initSubmit();
    handleLinePayReturn();
    initQuery();
    initPayStyle();
    initMiniReviews();
    initBackToTop();
  });

})();

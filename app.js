/* app.js — Ganxin Orchard (final) */
/* 全站 JS：SEO、購物車、LINE Pay、產品互動、滾動動畫等 */
(() => {
  'use strict';

  // ---- 小工具 ----
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const currency = n => `NT$ ${(n||0).toLocaleString()}`;
  const inView = (el, ratio=0.2) => {
    if (!el) return;
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(ent => {
        if (ent.isIntersecting) {
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, {threshold: ratio});
    io.observe(el);
  };

  // 允許 CONFIG 來自 index.html；若不存在，給安全預設
  const CONFIG = window.CONFIG || {
    BRAND_TAG: "柑心果園",
    GAS_ENDPOINT: "",
    PAY: { currency: "TWD" },
    PRICES: {
      PONGAN: {"10台斤": {"25A": 780}},
      MAOGAO: {"10台斤": {"25A": 760}}
    },
    INVENTORY: {}
  };

  // ---- SEO：JSON-LD 結構化資料 ----
  function injectSEO() {
    try {
      const ld = [];

      // Organization
      const logo = (window.CONFIG?.IMAGES?.LOGO) ||
                   "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/%E6%9F%91%E5%BF%83%E6%9E%9C%E5%9C%92LOGO.png";
      const url  = location.origin + location.pathname;
      ld.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "柑心果園",
        "url": url,
        "logo": logo,
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61581488901343"
        ]
      });

      // WebSite with SearchAction（站內查詢可先做 placeholder）
      ld.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "柑心果園｜公老坪椪柑・東勢茂谷",
        "url": url,
        "potentialAction": {
          "@type": "SearchAction",
          "target": url + "?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      });

      // Products（以 10 台斤 25A 為例；可再擴充）
      const p1 = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "椪柑｜10台斤｜25A",
        "brand": {"@type":"Brand","name":"柑心果園"},
        "image": (window.CONFIG?.IMAGES?.PONGAN) || url,
        "description": "公老坪椪柑，皮薄好剝、酸甜平衡、果香乾淨。單一 10 台斤分級預購。",
        "offers": {
          "@type": "Offer",
          "priceCurrency": CONFIG.PAY?.currency || "TWD",
          "price": String(CONFIG.PRICES?.PONGAN?.["10台斤"]?.["25A"] || 780),
          "availability": "http://schema.org/PreOrder",
          "url": url + "#shop"
        }
      };
      const p2 = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "茂谷｜10台斤｜25A",
        "brand": {"@type":"Brand","name":"柑心果園"},
        "image": (window.CONFIG?.IMAGES?.MAOGAO) || url,
        "description": "東勢茂谷，皮薄多汁、細嫩高多汁、香氣清亮。單一 10 台斤分級預購。",
        "offers": {
          "@type": "Offer",
          "priceCurrency": CONFIG.PAY?.currency || "TWD",
          "price": String(CONFIG.PRICES?.MAOGAO?.["10台斤"]?.["25A"] || 760),
          "availability": "http://schema.org/PreOrder",
          "url": url + "#shop"
        }
      };
      ld.push(p1, p2);

      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    } catch (e) {
      console.warn('SEO JSON-LD 注入失敗：', e);
    }
  }

  // ---- 果實近拍：1:1 圖片比例（指定容器）----
  function enforceSquare(selector) {
    $$(selector).forEach(img => {
      img.style.objectFit = 'cover';
      img.style.aspectRatio = '1 / 1';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.loading = 'lazy';
    });
  }

  // ---- 三大信任點：滑入動畫（左右交錯）----
  function initFeatureSlideIns() {
    const cards = $$('#why .kpi');
    cards.forEach((c, i) => {
      c.classList.add(i % 2 ? 'from-right' : 'from-left'); // 交錯方向
      inView(c, 0.2);
    });

    // 若樣式未定義，動態補一份最小動畫
    if (!$('#__dyn_anim')) {
      const style = document.createElement('style');
      style.id = '__dyn_anim';
      style.textContent = `
        .from-left{opacity:0; transform:translateX(-24px); transition:.5s ease}
        .from-right{opacity:0; transform:translateX(24px); transition:.5s ease}
        .from-left.in,.from-right.in{opacity:1; transform:none}
      `;
      document.head.appendChild(style);
    }
  }

  // ---- 產品卡：價格 + 已售出／剩餘 —— 併到同一列 ----
  function refreshVarietyMeta() {
    const map = [
      {kind:'PONGAN', price:'#price-pongan', meta:'#inv-pongan'},
      {kind:'MAOGAO', price:'#price-maogao', meta:'#inv-maogao'}
    ];
    map.forEach(({kind, price, meta}) => {
      const priceEl = $(price);
      const metaEl  = $(meta);
      if (!priceEl || !metaEl) return;

      // 解析出目前顯示的規格（從規格籤 active）
      const active = $(`#spec-${kind.toLowerCase()} .active`);
      const size = active ? active.textContent.split('｜').pop().trim() : '25A';
      const weight = '10台斤';
      const section = kind;
      const pid = (kind==='PONGAN' ? `PON10-${size}` : `MAO10-${size}`);
      const inv = CONFIG.INVENTORY?.[pid] || {sold:0, stock:0};
      const priceVal = CONFIG.PRICES?.[section]?.[weight]?.[size] || 0;

      // 合併到一行：價格 | 已售出 / 剩餘
      const merged = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <strong>${currency(priceVal)}</strong>
          <span class="note">已售出 ${inv.sold}｜剩 ${inv.stock}</span>
        </div>
      `;
      priceEl.innerHTML = merged;
      metaEl.style.display = 'none'; // 原本的行關掉（我們已併入）
    });
  }

  // ---- 規格選擇變更 → 重算價格/庫存列 ----
  function bindSpecChips() {
    ['pongan','maogao'].forEach(k=>{
      $$('#spec-'+k+' .spec').forEach(btn=>{
        on(btn,'click', ()=>{
          setTimeout(refreshVarietyMeta, 0); // 等 class .active 切完再刷新
        });
      });
    });
    // 初始刷新一次
    refreshVarietyMeta();
  }

  // ---- 購買流程：小圓鈕 → 展開原本卡片 ----
  function initFlowToggles() {
    const dots = $$('#flow .flow-dot');
    const cards = $$('#flow .flow-card');
    if (!dots.length || !cards.length) return;

    const setActive = (idx) => {
      dots.forEach((d,i)=> d.classList.toggle('on', i===idx));
      cards.forEach((c,i)=> c.style.display = (i===idx ? 'block' : 'none'));
    };
    dots.forEach((d,i)=> on(d,'click', ()=> setActive(i)));
    setActive(0);
  }

  // ---- 購物車抽屜 & 浮動 FAB ----
  function initCart() {
    const drawer = $('#cartDrawer');
    const fab = $('#cartFab');
    if (fab) on(fab,'click', ()=> drawer?.classList.add('open'));
    const closeBtn = $('#cartDrawer header .btn');
    if (closeBtn) on(closeBtn,'click', ()=> drawer?.classList.remove('open'));
  }

  // ---- 付款方式：LINE Pay 綠色化（樣式由 CSS 控 .linepay-active）----
  function initPayStyle() {
    const payRadios = $$('input[name="pay"]');
    const form = $('#orderForm');
    if (!form || !payRadios.length) return;

    const apply = () => {
      const val = (form.querySelector('input[name="pay"]:checked') || {}).value || '';
      document.body.classList.toggle('linepay-active', val === 'LINEPAY');
    };
    payRadios.forEach(r=> on(r,'change', apply));
    apply();
  }

  // ---- 回到頂部 ----
  function initBackToTop() {
    const toTop = $('#backToTop');
    if (!toTop) return;
    on(toTop,'click', (e)=>{
      e.preventDefault();
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }

  // ---- LINE Pay 串接（沿用 GAS 後端）----
  async function goLinePay(orderNo, payload){
    const amount = payload.summary.total;
    try{
      const r = await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_request', {
        method:'POST',
        body: JSON.stringify({
          orderNo, amount,
          currency: CONFIG.PAY?.currency || 'TWD',
          items: payload.items
        })
      });
      const d = await r.json();
      if(!d.ok) throw new Error(d.msg||'LINE Pay 建立交易失敗');
      localStorage.setItem('gx_lp_orderNo', orderNo);
      localStorage.setItem('gx_lp_amount', String(amount));
      location.href = d.paymentUrl; // 導轉到 LINE Pay
    }catch(e){
      alert('LINE Pay 建立失敗：' + e.message);
    }
  }

  async function handleLinePayReturn(){
    const params=new URLSearchParams(location.search);
    if(params.get('lp')==='return'){
      const orderNo=localStorage.getItem('gx_lp_orderNo');
      const amount=Number(localStorage.getItem('gx_lp_amount')||'0');
      const transactionId=params.get('transactionId');
      if(orderNo && transactionId){
        try{
          const body={ orderNo, transactionId, amount, currency:CONFIG.PAY?.currency||'TWD' };
          const r=await fetch(CONFIG.GAS_ENDPOINT + '?action=linepay_confirm', { method:'POST', body: JSON.stringify(body) });
          const d=await r.json();
          if(d.ok){
            toast('付款成功，感謝支持！');
            // 清空購物車（若你的購物車另有實作，這裡只負責提示）
            localStorage.removeItem('gx_lp_orderNo');
            localStorage.removeItem('gx_lp_amount');
          }else{
            alert('付款確認失敗：'+(d.msg||'')); 
          }
        }catch(e){
          alert('付款確認錯誤：'+e.message);
        }
      }
    }
  }

  // ---- 下單（沿用你原本 submitOrder 流程，只補 LINEPAY 分支）----
  function initSubmitOrder() {
    const form = $('#orderForm');
    if (!form) return;

    on(form, 'submit', async (ev)=>{
      ev.preventDefault();
      const cartStr = localStorage.getItem('gx_cart') || '[]';
      const cart = JSON.parse(cartStr);
      if (!cart.length) { alert('購物車是空的'); return; }

      const agree = $('#agree');
      if (agree && !agree.checked) { alert('請先閱讀「物流與退貨說明」並勾選同意'); return; }

      const f = new FormData(form);
      // 僅保留宅配（你之前要求移除超取）
      const shipMethod = 'HOME';

      // 驗證
      for (const k of ['name','phone','email']) {
        if (!f.get(k)) { alert('請完整填寫訂單資料'); return; }
      }
      if (!f.get('addr')) { alert('請填寫宅配地址'); return; }

      // 統計金額
      const subtotal = cart.reduce((s,i)=> s + i.price * i.qty, 0);
      const shipping = (subtotal >= (CONFIG.FREE_SHIP_THRESHOLD||1800)) ? 0 : (CONFIG.SHIPPING||160);
      const summary = {subtotal, shipping, total: subtotal+shipping};

      const payload = {
        ts:new Date().toISOString(),
        name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
        addr: f.get('addr')||'',
        ship: '宅配',
        remark:f.get('remark')||'',
        items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
        summary,
        brand: CONFIG.BRAND_TAG,
        shipMeta:{method:shipMethod}
      };

      const btn = $('#submitBtn'); const resBox = $('#result');
      if (btn) { btn.disabled = true; btn.textContent = '處理中…'; }
      if (resBox) resBox.textContent = '';

      try{
        // 1) 先建立訂單
        const r1 = await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
        const d1 = await r1.json();
        if(!d1.ok) throw new Error(d1.msg||'建立訂單失敗');
        const orderNo = d1.order_no;

        const payMethod = (form.querySelector('input[name="pay"]:checked') || {}).value || 'LINEPAY';
        if (payMethod === 'LINEPAY') {
          await goLinePay(orderNo, payload);
          return;
        } else {
          // 匯款：顯示銀行資訊（不固定在頁尾）
          if (resBox) {
            const bank = CONFIG.BANK || {name:'',holder:'',no:''};
            resBox.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>
              請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。
              <div class="card" style="padding:10px; margin-top:8px">
                <div><b>${bank.name||''}</b></div>
                <div>戶名：<b>${bank.holder||''}</b></div>
                <div>帳號：<b>${bank.no||''}</b></div>
              </div>`;
          }
          // 清空購物車
          localStorage.setItem('gx_cart', '[]');
        }
      }catch(e){
        if (resBox) resBox.textContent = '送出失敗：' + e.message;
      }finally{
        if (btn) { btn.disabled = false; btn.textContent = '送出訂單'; }
      }
    });
  }

  // ---- 簡易 Toast ----
  function toast(msg){
    const t = $('#toast'); if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__tt);
    window.__tt = setTimeout(()=> t.classList.remove('show'), 1800);
  }

  // ---- 真實好評的速度微調（如果你用跑馬燈）----
  function tuneReviews(speedPxPerSec=60){
    const track = $('#rvTrack');
    if (!track) return;
    // 用內容高度反推動畫時間，速度比之前更慢
    requestAnimationFrame(()=>{
      const single = track.scrollHeight / 2;
      const dur = Math.max(12, Math.round(single / speedPxPerSec));
      track.style.animationDuration = `${dur}s`;
    });
  }

  // ---- 讓指定容器內的圖片 1:1（近拍卡）----
  function initSquareGalleries() {
    // 你可依實際 HTML 調整 selector
    enforceSquare('#closeupGallery img, .closeup-card img, .gallery-1x1 img');
  }

  // ---- 綁定事件 & 初始化 ----
  document.addEventListener('DOMContentLoaded', () => {
    injectSEO();
    initCart();
    initPayStyle();
    initBackToTop();
    initFlowToggles();
    initFeatureSlideIns();
    bindSpecChips();
    refreshVarietyMeta();
    initSubmitOrder();
    initSquareGalleries();
    handleLinePayReturn();
    tuneReviews(58); // 更慢一些、較舒適
  });

})();

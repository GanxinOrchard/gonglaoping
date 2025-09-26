/* =========================
   Cart Enhancer (覆蓋版)
   ========================= */
(function(){
  const LS_CART = 'gx_cart';
  const FREE_SHIP = 1800;
  const SHIPPING_FEE = 160;

  // 折扣碼（可自行改日期）
  const COUPONS = [
    { code:'GX200OFF', type:'amount', value:200,   expire:'2099-12-31' },
    { code:'GX90PCT',  type:'percent', value:0.90, expire:'2099-12-31' }
  ];
  function todayStr(){
    const d=new Date(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${m}-${da}`;
  }
  function couponValid(c){
    if(!c) return null;
    const code = String(c||'').trim().toUpperCase();
    const obj = COUPONS.find(x=>x.code===code);
    if(!obj) return null;
    return (todayStr()<=obj.expire) ? obj : null;
  }

  // 若頁面已有 CART，就沿用；否則建立
  const CART = (function(existing){
    if (existing && existing.items && Array.isArray(existing.items)) return existing;
    const store = {
      items: [],
      load(){
        try{ const raw=localStorage.getItem(LS_CART); this.items = raw? JSON.parse(raw):[]; }catch{ this.items=[]; }
      },
      save(){ localStorage.setItem(LS_CART, JSON.stringify(this.items)); },
      clear(){ this.items=[]; this.save(); }
    };
    store.load();
    return store;
  })(window.CART);

  // DOM 快捷
  const $id = (id)=>document.getElementById(id);
  const $$  = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // 更新角標（若有）
  function updateCartIcon(){
    const n = CART.items.reduce((s,i)=>s + Number(i.qty||0), 0);
    const a = $id('fabCount') || $id('cartCount') || document.querySelector('.cart-count');
    if (a) a.textContent = n;
  }

  // 計算總金額（含折扣）
  function calcTotals(couponCode){
    const sub = CART.items.reduce((s,i)=> s + (Number(i.price||0)*Number(i.qty||0)), 0);
    const shipping = (sub===0 || sub>=FREE_SHIP) ? 0 : SHIPPING_FEE;
    let discount = 0;
    const c = couponValid(couponCode);
    if (c){
      discount = (c.type==='amount') ? c.value : Math.round(sub*(1-c.value));
    }
    const total = Math.max(0, sub + shipping - discount);
    return { sub, shipping, discount, total };
  }

  // 同步兩套 ID（避免你舊檔不同命名）
  function syncMoney({sub,shipping,discount,total}){
    const map = [
      ['subtotal','cartSubtotal', sub],
      ['shipping','cartShipping', shipping],
      ['discount','cartDiscount', discount],
      ['total','cartTotal', total]
    ];
    map.forEach(([a,b,val])=>{
      const n1 = $id(a); if(n1) n1.textContent = toCurrency(val);
      const n2 = $id(b); if(n2) n2.textContent = toCurrency(val);
    });
    // 免運提示（若有）
    const freeText = $id('freeShipText'); if(freeText) freeText.textContent = FREE_SHIP.toLocaleString();
  }
  const toCurrency = (n)=> 'NT$ ' + (Number(n)||0).toLocaleString('en-US');

  // 橘色購物車面板（不更動你的 HTML 結構，只渲染 list 與金額）
  function renderCart(){
    const list = $id('cartList');
    if (!list) return;
    list.innerHTML = '';
    if (!CART.items.length){
      list.innerHTML = `<div class="muted">購物車是空的，去挑幾顆最頂的橘子吧 🍊</div>`;
    }else{
      const ul = document.createElement('ul');
      ul.className = 'cart-list';
      CART.items.forEach((it, idx)=>{
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <img src="${it.thumb || 'https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png'}"
               alt="${(it.title||'商品')+' 裝箱圖'}" loading="lazy">
          <div class="t">${it.title || ''}</div>
          <div class="p">NT$ ${Number(it.price||0).toLocaleString()}</div>
          <div class="qty">
            <button aria-label="減1">-</button>
            <span>${it.qty||1}</span>
            <button aria-label="加1">+</button>
          </div>`;
        ul.appendChild(li);

        const [btnMinus, btnPlus] = li.querySelectorAll('.qty button');
        const qtySpan = li.querySelector('.qty span');
        btnMinus.addEventListener('click', ()=>{
          it.qty = Math.max(0, Number(it.qty||0) - 1);
          if (it.qty===0){ CART.items.splice(idx,1); }
          CART.save(); renderCart(); updateCartIcon();
        });
        btnPlus.addEventListener('click', ()=>{
          it.qty = Number(it.qty||0) + 1;
          CART.save(); renderCart(); updateCartIcon();
        });
      });
      list.appendChild(ul);
    }

    // 折扣碼
    const couponInput = $id('couponInput');
    const code = couponInput ? couponInput.value.trim() : '';
    const sum = calcTotals(code);
    syncMoney(sum);
    // 免運提示條（若有）
    const notice = document.querySelector('.panel.cart .notice');
    if (notice){
      notice.textContent = sum.sub >= FREE_SHIP ? '已達免運門檻 🎉'
        : `滿 NT$ ${FREE_SHIP.toLocaleString()} 免運（還差 NT$ ${(FREE_SHIP-sum.sub).toLocaleString()}）`;
    }
  }

  // 事件：套用折扣
  function bindCoupon(){
    const input = $id('couponInput');
    const btn   = $id('btnApplyCoupon') || document.querySelector('[data-apply-coupon]');
    const hint  = $id('couponHint') || document.querySelector('.hint.coupon');
    if (!input) return;

    function apply(){
      const code = input.value.trim();
      const ok = couponValid(code);
      if (!code){
        if (hint) hint.textContent = '輸入折扣碼（例：GX200OFF、GX90PCT）';
      }else if (!ok){
        if (hint) hint.textContent = '折扣碼不存在或已過期';
      }else{
        if (hint) hint.textContent = (ok.type==='amount')?'已套用：現折 NT$'+ok.value: '已套用：九折';
      }
      renderCart();
    }
    input.addEventListener('change', apply);
    if (btn) btn.addEventListener('click', apply);
  }

  // 清空/關閉（保留你原本的兩顆綠色按鈕）
  function bindHeaderButtons(){
    const btnClear = $id('btnClearCart') || document.querySelector('[data-cart-clear]');
    const btnClose = $id('btnCloseCart') || document.querySelector('[data-cart-close]');
    if(btnClear){
      btnClear.addEventListener('click', ()=>{
        if(confirm('確定要清空購物車？')){
          CART.clear(); renderCart(); updateCartIcon();
        }
      });
    }
    if(btnClose){
      btnClose.addEventListener('click', ()=>{
        const panel = document.querySelector('.panel.cart') || $id('cartDrawer');
        if(panel) panel.classList.remove('show','open');
      });
    }
  }

  // 加入購物車：不自動開面板，改為吐司 + 角標
  function patchAddToCart(){
    // 若頁面已有 addToCart，就包一層
    const oldAdd = window.addToCart;
    window.addToCart = function(pid,title,price,weight,size,section,thumb){
      const item = { id:pid, title, price:Number(price)||0, qty:1, weight, size, section, thumb };
      // 合併同品項
      const found = CART.items.find(x=>x.id===pid);
      if (found) found.qty += 1; else CART.items.push(item);
      CART.save(); updateCartIcon();
      // 吐司
      showToast('已加入購物車');
      // 不打開購物車
      if (typeof oldAdd === 'function'){ try{ oldAdd(pid,title,price,weight,size,section,thumb); }catch{} }
    };
  }

  // 簡單吐司（若站上已經有 showToast 就沿用）
  function showToast(msg){
    if (typeof window.showToast === 'function') return window.showToast(msg);
    let t = $id('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;right:14px;bottom:88px;background:#111;color:#fff;padding:10px 14px;border-radius:10px;opacity:0;transition:.25s;z-index:120'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = 1; setTimeout(()=>t.style.opacity=0,1500);
  }

  // 提交訂單前的「送出中」防呆（若有 orderForm）
  function bindSubmitGuard(){
    const form = $id('orderForm');
    const submitBtn = $id('submitBtn') || (form && form.querySelector('[type=submit]'));
    if (!form || !submitBtn) return;
    form.addEventListener('submit', ()=>{
      submitBtn.disabled = true;
      submitBtn.textContent = '送出訂單中，請稍候…';
      setTimeout(()=>{ try{ submitBtn.disabled=false; submitBtn.textContent='送出訂單'; }catch{} }, 15000);
    });
  }

  // LINE Pay app/web 自動選擇（如你的後端會回傳 appUrl/webUrl）
  window.goLinePay = async function(orderNo, payload){
    try{
      // 新版：你的 doPost 會回傳 linepay {appUrl, webUrl}，這裡只處理導轉策略
      // 預計由你原本 submitOrder() 取得後呼叫本函式
      const info = payload && payload.linepay ? payload.linepay : null;
      if (!info || (!info.appUrl && !info.webUrl)) throw new Error('找不到付款網址');

      // 行動裝置試 appUrl，失敗再 webUrl；桌機直接 webUrl
      const ua = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|line\//.test(ua);
      if (isMobile && info.appUrl){
        // 開 appUrl（同頁），若 1.2 秒後仍停留，改開 webUrl
        const now = Date.now();
        location.href = info.appUrl;
        setTimeout(()=>{ if (Date.now()-now<1500 && info.webUrl){ location.href = info.webUrl; } }, 1200);
      }else{
        location.href = info.webUrl || info.appUrl;
      }
    }catch(e){
      alert('建立 LINE Pay 交易失敗：'+e.message);
    }
  };

  // 啟動
  function init(){
    try{ CART.load(); }catch{}
    renderCart();
    bindCoupon();
    bindHeaderButtons();
    bindSubmitGuard();
    patchAddToCart();
    updateCartIcon();

    // 折扣碼欄位 placeholder（有你要的範例）
    const couponInput = $id('couponInput'); if (couponInput && !couponInput.placeholder) couponInput.placeholder = '輸入折扣碼（例：GX200OFF 或 GX90PCT）';

    // 表單欄位 placeholder（iOS 防縮放 + 範例）
    const f = $id('orderForm');
    if (f){
      const map = {
        name:'例：陳小橘',
        phone:'例：0912-345-678',
        email:'例：orange@example.com',
        addr:'例：台中市○○區○○路 123 號 5 樓',
        remark:'例：平日 18:00 後收件'
      };
      Object.keys(map).forEach(k=>{
        const el = f.querySelector(`[name="${k}"]`);
        if (el && !el.placeholder) el.placeholder = map[k];
        if (el) el.style.fontSize='16px'; // iOS 防縮放
      });
    }
  }
  document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',init) : init();

  // 對外少量導出（若你其他程式需要）
  window.CART = CART;
  window.renderCart = renderCart;
  window.updateCartIcon = updateCartIcon;
})();
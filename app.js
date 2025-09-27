/* =========================================
   柑心果園｜前端互動（保留你原本邏輯）
   - 浮動購物車抽屜（固定、不亂動）
   - 產品卡：規格/數量/加入購物車
   - iOS 輸入字體 >=16（避免放大）
   - 送單到 Google Apps Script（GAS_ENDPOINT）
   ========================================= */

const GAS_ENDPOINT = window.GAS_ENDPOINT || ""; // index.html 會塞進來

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const state = {
  cart: []  // {sku,title,price,qty,spec,img}
};

function format(n){ return 'NT$ ' + (Number(n)||0).toLocaleString('en-US'); }
function shipFee(sub){ return sub >= 1800 ? 0 : 120; }

/* ===== 規格尺寸條 ===== */
function updateDiamMeter(card){
  const sel = $('.js-spec', card);
  const diam = sel?.selectedOptions?.[0]?.dataset?.diam || '';
  const bar  = $('.js-diam', card);
  if (bar){
    // 簡單依四檔對映條寬
    const v = sel.value;
    const width = (v==='23A'?40 : v==='25A'?55 : v==='27A'?70 : 85);
    bar.style.width = width + '%';
  }
}

/* ===== 產品卡互動 ===== */
function initProducts(){
  $$('.product-card').forEach(card=>{
    updateDiamMeter(card);

    // 規格切換 → 尺寸條更新
    const specSel = $('.js-spec', card);
    specSel && specSel.addEventListener('change', ()=>updateDiamMeter(card));

    // 數量
    const qty = $('.js-qty', card);
    $('.plus', card)?.addEventListener('click', ()=>{ qty.value = Math.max(1, (parseInt(qty.value)||1) + 1); });
    $('.minus', card)?.addEventListener('click', ()=>{ qty.value = Math.max(1, (parseInt(qty.value)||1) - 1); });

    // 加入購物車（不自動打開抽屜）
    $('.js-add', card)?.addEventListener('click', ()=>{
      const sku   = card.dataset.sku;
      const title = $('h3', card).textContent.trim();
      const price = Number($('.js-price', card).dataset.base || $('.js-price', card).textContent) || 0;
      const spec  = $('.js-spec', card)?.value || '';
      const img   = $('img', card)?.src || '';
      const qtyN  = Math.max(1, parseInt($('.js-qty', card)?.value)||1);

      // 若同品同規格已在車上 → 增量
      const found = state.cart.find(it => it.sku===sku && it.spec===spec);
      if (found){ found.qty += qtyN; }
      else { state.cart.push({ sku, title, price, qty: qtyN, spec, img }); }

      renderCart();  // 只更新金額，不強制開啟抽屜
      // 小提示
      toast('已加入購物車');
    });
  });
}

/* ===== 購物車抽屜 ===== */
const cartEl = $('#cart');
const fabEl  = $('#cart-fab');

function openCart(){ cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden','false'); }
function closeCart(){ cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden','true'); }

function renderCart(){
  const list = $('#cart-list');
  list.innerHTML = '';

  let sub = 0;
  state.cart.forEach((it, idx)=>{
    const line = it.price * it.qty; sub += line;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${it.img}" alt="${it.title}">
      <div>
        <h4>${it.title}</h4>
        <div class="meta">規格：${it.spec}　單價：${format(it.price)}</div>
        <div class="meta">數量：<input type="number" min="1" value="${it.qty}" data-idx="${idx}" class="cart-qty" style="width:70px;margin-left:6px"></div>
      </div>
      <div style="text-align:right">
        <div>${format(line)}</div>
        <button class="btn ghost cart-del" data-idx="${idx}" style="margin-top:6px">刪除</button>
      </div>
    `;
    list.appendChild(row);
  });

  // 綁定數量/刪除
  $$('.cart-qty', list).forEach(inp=>{
    inp.addEventListener('change', e=>{
      const i = parseInt(e.target.dataset.idx);
      const v = Math.max(1, parseInt(e.target.value)||1);
      state.cart[i].qty = v;
      renderCart();
    });
  });
  $$('.cart-del', list).forEach(btn=>{
    btn.addEventListener('click', e=>{
      const i = parseInt(e.currentTarget.dataset.idx);
      state.cart.splice(i,1);
      renderCart();
    });
  });

  // 金額
  const fee = shipFee(sub);
  $('#sum-sub').textContent = format(sub);
  $('#sum-ship').textContent = format(fee);
  $('#sum-total').textContent = format(sub + fee);
}

/* ===== 送單到 GAS ===== */
async function submitOrder(ev){
  ev.preventDefault();
  if (!state.cart.length){ alert('購物車是空的'); return; }

  const form = ev.currentTarget;
  const fd = new FormData(form);
  const name = (fd.get('name')||'').trim();
  const phone= (fd.get('phone')||'').trim();
  const email= (fd.get('email')||'').trim();
  const addr = (fd.get('addr')||'').trim();
  const remark=(fd.get('remark')||'').trim();
  const pay = fd.get('pay') || 'remit';

  if (!name || !phone || !addr){ alert('請完整填寫姓名 / 手機 / 地址'); return; }

  const sub = state.cart.reduce((s,it)=>s+it.price*it.qty,0);
  const data = {
    name, phone, email, addr, remark,
    ship: '宅配',
    payMethod: pay === 'linepay' ? 'linepay' : 'remit',
    items: state.cart.map(it=>({
      title: it.title, weight: '10斤', size: it.spec,
      price: it.price, qty: it.qty
    })),
    summary: { subtotal: sub, shipping: shipFee(sub), total: sub + shipFee(sub) }
  };

  // 防呆提示
  const btn = $('#btn-submit'); const old = btn.textContent;
  btn.disabled = true; btn.textContent = '送出訂單中，請稍候…';

  try{
    const res = await fetch(GAS_ENDPOINT, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const j = await res.json();

    if (!j.ok){
      alert('送單失敗：' + (j.msg || '未知錯誤'));
      btn.disabled = false; btn.textContent = old;
      return;
    }

    if (j.linepay && j.linepay.webUrl){
      // 不自動關閉；帶使用者去 LINE Pay
      window.location.href = j.linepay.webUrl;
      return;
    }

    // 匯款或無 LinePay → 成功
    alert('訂單建立成功！我們會盡快為您處理。訂單編號：' + (j.order_no||''));
    state.cart = []; renderCart(); closeCart();
    form.reset();
  }catch(err){
    alert('連線失敗：' + err.message);
  }finally{
    btn.disabled = false; btn.textContent = old;
  }
}

/* ===== 小提示 ===== */
let toastTimer=null;
function toast(msg){
  let t = $('#gx-toast');
  if(!t){
    t = document.createElement('div'); t.id='gx-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.2);z-index:200;font-weight:800';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity='1';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{ t.style.opacity='0'; }, 1500);
}

/* ===== 綁定 ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  // iOS 輸入字體 >=16 避免放大（雙保險，CSS 也已設）
  $$('input,select,textarea').forEach(el=>{
    const fs = parseFloat(getComputedStyle(el).fontSize||'16');
    if (fs < 16) el.style.fontSize = '16px';
  });

  initProducts();
  renderCart();

  // 購物車抽屜開關
  $('#cart-fab').addEventListener('click', openCart);
  $('#cart-close').addEventListener('click', closeCart);
  $('#cart-clear').addEventListener('click', ()=>{
    if (confirm('確定要清空購物車嗎？')){ state.cart=[]; renderCart(); }
  });

  $('#checkout').addEventListener('submit', submitOrder);
});
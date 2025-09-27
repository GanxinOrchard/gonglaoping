/* ========= 可調設定 ========= */
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec"; // 你提供的
const FREE_SHIP_THRESHOLD = 1800;
const SHIP_FEE = 160;

/* 折扣碼（可自行改日期） */
const COUPONS = [
  { code: "橘子200", type: "minus", value: 200, expire: "2026-04-30" },
  { code: "ORANGE10", type: "percent", value: 10, expire: "2026-04-30" }
];

/* 產品資料（用箱子圖） */
const PRODUCTS = {
  ponkan: {
    title: "椪柑｜10斤",
    price: 750,
    img: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png",
    sold: 132, left: 68
  },
  murcott: {
    title: "茂谷柑｜10斤",
    price: 820,
    img: "https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png",
    sold: 95, left: 105
  }
};

/* 規格尺寸（直徑 cm）：
 * 參考資料：有的用「肚圍」(周長)分級，23A 約 21.1–23 cm 肚圍 ≒ 直徑 6.7–7.3 cm；
 * 25A 約 7.0–7.5 cm；27A 約 7.6–8.6 cm；30A 約 8.6–9.6 cm（不同果園略有差異）。
 * 來源：coolbar 文章（23A ~ 6–6.5cm、25A ~ 7–7.5cm）與以肚圍分級的果園說明（21.1–23cm 等）。
 */
const SIZE_DIAMETER = {
  "23A": "約 6.7–7.3 cm",
  "25A": "約 7.0–7.8 cm",
  "27A": "約 7.9–8.6 cm",
  "30A": "約 8.7–9.6 cm"
};

/* 甘心量表（長條圖）根據規格微幅變動（示意） */
const SPEC_METER = {
  ponkan: { base:{sweet:78, acid:32, aroma:62}, bump:{ "23A":-4,"25A":0,"27A":+3,"30A":+4 } },
  murcott:{ base:{sweet:85, acid:40, aroma:80}, bump:{ "23A":-4,"25A":0,"27A":+3,"30A":+4 } }
};

/* ========== 工具 ========== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const money = n => `NT$ ${Number(n||0).toLocaleString("en-US")}`;
const todayStr = () => new Date().toISOString().slice(0,10);
const isExpired = (d) => new Date(d+"T23:59:59") < new Date();

/* iOS 防縮放：確保表單字體 >=16px（CSS 也已做） */

/* ========== 故事/近拍 輪播基礎 ========== */
function mountCarousel(root){
  const track = root.querySelector('.c-track');
  const prev = root.querySelector('.c-prev');
  const next = root.querySelector('.c-next');
  let index = 0;

  function go(i){
    const cards = track.children.length;
    index = Math.max(0, Math.min(cards-1, i));
    track.scrollTo({left: track.clientWidth*index, behavior:'smooth'});
  }
  prev?.addEventListener('click', ()=>go(index-1));
  next?.addEventListener('click', ()=>go(index+1));
  // 觸控滑動
  let sx=0, sl=0, down=false;
  track.addEventListener('pointerdown', e=>{down=true;sx=e.clientX;sl=track.scrollLeft});
  track.addEventListener('pointermove', e=>{ if(down) track.scrollLeft = sl - (e.clientX-sx) });
  track.addEventListener('pointerup', ()=>{down=false; index = Math.round(track.scrollLeft/track.clientWidth) });
}

/* ========== 產季時間軸生成 ========== */
function monthNode(m, active, txt, hue){
  // hue 控綠→橘：110(綠) → 30(橘)
  const color = `hsl(${hue},70%,60%)`;
  const ring  = active? '#ffcf99' : '#e9e9e9';
  return `
    <div class="month-dot">
      <div class="fruit" style="background:${active?color:'#dcdcdc'};border-color:${ring}"></div>
      <div class="txt"><div>${m}月</div><div style="color:#666">${txt||''}</div></div>
    </div>`;
}
function buildSeasonLines(){
  // 椪柑：10-12
  const pon = $('#linePonkan');
  const mur = $('#lineMurcott');
  const months = Array.from({length:12},(_,i)=>i+1);
  pon.innerHTML = months.map(m=>{
    const active = (m>=10 && m<=12);
    const prog = (m-10)/(12-10||1); // 0~1
    const hue = 110 - Math.max(0,Math.min(1,prog))*80; // 綠→橘
    const txt = active ? (m===10?'青皮脆甜':m===11?'轉色好吃':'橙皮熟成') : '';
    return monthNode(m, active, txt, hue);
  }).join('');
  // 茂谷：12-3
  mur.innerHTML = months.map(m=>{
    const active = (m===12 || m<=3);
    const order = m===12?0:(m<=3?m:4); // 0..3
    const hue = 110 - (order/3)*80;
    const txt = active ? (m===12?'初採':m===1?'高峰':m===2?'香氣濃':m===3?'尾聲':'') : '';
    return monthNode(m, active, txt, hue);
  }).join('');
}

/* ========== 規格切換（量表＋尺寸） ========== */
function applySpec(card, spec){
  card.querySelectorAll('.spec').forEach(b=>b.classList.toggle('on', b.dataset.spec===spec));
  const sku = card.dataset.sku;
  const cfg = SPEC_METER[sku];
  const bump = cfg.bump[spec]||0;
  card.querySelector('[data-bar="sweet"]').style.width = Math.max(10, Math.min(100, cfg.base.sweet + bump))+'%';
  card.querySelector('[data-bar="acid"]').style.width  = Math.max(5,  Math.min(100, cfg.base.acid  - bump*0.5))+'%';
  card.querySelector('[data-bar="aroma"]').style.width = Math.max(10, Math.min(100, cfg.base.aroma + bump*0.7))+'%';
  card.querySelector('.size-text').textContent = SIZE_DIAMETER[spec] || '—';
}

/* ========== 購物車資料 ========== */
const cart = {
  items: [], // { sku, title, price, spec, qty }
  coupon: null,
  load(){
    try{
      const raw = localStorage.getItem('gx_cart');
      const o = raw? JSON.parse(raw) : {items:[], coupon:null};
      this.items = o.items||[]; this.coupon = o.coupon||null;
    }catch{ this.items=[]; this.coupon=null; }
  },
  save(){ localStorage.setItem('gx_cart', JSON.stringify({items:this.items, coupon:this.coupon})) },
  add(sku, spec, qty){
    const p = PRODUCTS[sku]; if(!p) return;
    const hit = this.items.find(it=>it.sku===sku && it.spec===spec);
    if(hit) hit.qty += qty;
    else this.items.push({ sku, title: p.title, price: p.price, spec, qty });
    this.save();
  },
  del(idx){ this.items.splice(idx,1); this.save(); },
  clear(){ this.items=[]; this.coupon=null; this.save(); },
  subtotal(){ return this.items.reduce((s,it)=>s+it.price*it.qty,0) },
  discount(){
    if(!this.coupon) return 0;
    if(isExpired(this.coupon.expire)) return 0;
    const sub = this.subtotal();
    if(this.coupon.type==='minus') return Math.min(sub, this.coupon.value);
    if(this.coupon.type==='percent') return Math.floor(sub * (this.coupon.value/100));
    return 0;
  },
  shipping(totalAfterDisc){ return totalAfterDisc>=FREE_SHIP_THRESHOLD? 0: SHIP_FEE; },
  total(){ const sub=this.subtotal(), off=this.discount(); return sub - off + this.shipping(sub - off); }
};
cart.load();

/* 表單記憶 */
const formMem = {
  keys:['name','phone','email','ship','addr','remark'],
  load(){ this.keys.forEach(k=>{ const el=$('#'+k); if(el){ const v=localStorage.getItem('gx_'+k); if(v!==null) el.value=v; } }); toggleAddr(); },
  save(){ this.keys.forEach(k=>{ const el=$('#'+k); if(el) localStorage.setItem('gx_'+k, el.value||''); }); }
};

/* ========== UI：購物車 ========== */
const drawer = $('#cartDrawer');
function openCart(){ drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); }
function closeCart(){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); }
$('#cartToggle').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
$('#cartClear').addEventListener('click', ()=>{ if(confirm('要清空購物車嗎？')){ cart.clear(); renderCart(); toast('已清空'); } });

function renderCart(){
  // 商品列
  const list = $('#cartList'); list.innerHTML = '';
  if(cart.items.length===0){
    list.innerHTML = `<div style="text-align:center;color:#333;background:#fff;border-radius:12px;padding:14px">購物車是空的</div>`;
  }else{
    cart.items.forEach((it, idx)=>{
      const div = document.createElement('div');
      div.className='cart-item';
      const img = PRODUCTS[it.sku]?.img || '';
      div.innerHTML = `
        <img src="${img}" alt="${it.title}" loading="lazy">
        <div>
          <div class="ci-title">${it.title}</div>
          <div class="ci-meta">規格：${it.spec}</div>
          <div class="ci-qty">
            <input type="number" min="1" value="${it.qty}" data-idx="${idx}" />
          </div>
        </div>
        <div>
          <div style="font-weight:900">${money(it.price*it.qty)}</div>
          <button class="ci-del" data-del="${idx}">刪除</button>
        </div>`;
      list.appendChild(div);
    });
  }
  // 金額
  const sub = cart.subtotal();
  const off = cart.discount();
  const ship = cart.shipping(sub - off);
  $('#sumSubtotal').textContent = money(sub);
  $('#sumDiscount').textContent = `- ${money(off)}`;
  $('#sumDiscountRow').classList.toggle('hidden', off<=0);
  $('#sumShipping').textContent = money(ship);
  $('#sumTotal').textContent = money(sub - off + ship);

  // 可結帳條件
  const okAgree = $('#agree').checked;
  $('#checkout').disabled = !(cart.items.length>0 && okAgree);

  // 綁定事件
  $$('#cartList input[type="number"]').forEach(inp=>{
    inp.addEventListener('change', e=>{
      const idx = +e.target.dataset.idx;
      cart.items[idx].qty = Math.max(1, parseInt(e.target.value||'1',10));
      cart.save(); renderCart();
    });
  });
  $$('#cartList [data-del]').forEach(btn=>{
    btn.addEventListener('click', e=>{ cart.del(+e.target.dataset.del); renderCart(); });
  });
}
$('#agree').addEventListener('change', renderCart);

// 折扣碼
$('#couponApply').addEventListener('click', ()=>{
  const code = ($('#coupon').value||'').trim();
  const hit = COUPONS.find(c=>c.code.toLowerCase()===code.toLowerCase());
  if(!hit){ $('#couponMsg').textContent = '查無此折扣碼'; cart.coupon=null; cart.save(); renderCart(); return; }
  if(isExpired(hit.expire)){ $('#couponMsg').textContent = '此折扣碼已過期'; cart.coupon=null; cart.save(); renderCart(); return; }
  cart.coupon = hit; cart.save();
  $('#couponMsg').textContent = `已套用：${hit.code}`;
  renderCart();
});

// 表單記憶
['name','phone','email','ship','addr','remark'].forEach(id=>{
  const el = $('#'+id); if(!el) return;
  el.addEventListener('input', ()=>formMem.save());
});
$('#ship').addEventListener('change', ()=>{ formMem.save(); toggleAddr(); });
function toggleAddr(){
  const v = $('#ship').value;
  $('#addrWrap').style.display = (v==='宅配')? 'block' : 'none';
}

/* ========== 加入購物車（不自動開啟） ========== */
function toast(t){
  const el = $('#toast'); el.textContent = t; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1800);
}
$$('.prod-card').forEach(card=>{
  // 規格切換
  card.querySelectorAll('.spec').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      applySpec(card, btn.dataset.spec);
    });
  });
  // 數量
  const qMinus = card.querySelector('.q-minus');
  const qPlus  = card.querySelector('.q-plus');
  const qInp   = card.querySelector('input[type="number"]');
  qMinus.addEventListener('click', ()=>{ qInp.value = Math.max(1, (parseInt(qInp.value||'1',10)-1)); });
  qPlus.addEventListener('click',  ()=>{ qInp.value = Math.max(1, (parseInt(qInp.value||'1',10)+1)); });

  // 預設套用第一個規格
  const first = card.querySelector('.spec.on')?.dataset.spec || '25A';
  applySpec(card, first);

  // 加入購物車
  const addBtn = card.querySelector('[data-add]');
  addBtn.addEventListener('click', ()=>{
    const sku = addBtn.dataset.add;
    const spec = card.querySelector('.spec.on')?.dataset.spec || '25A';
    const qty = Math.max(1, parseInt(qInp.value||'1',10));
    cart.add(sku, spec, qty);
    renderCart();
    toast('已加入購物車');
  });
});

/* ========== Checkout ========== */
$('#checkout').addEventListener('click', async ()=>{
  if($('#checkout').disabled) return;
  const pay = document.querySelector('input[name="pay"]:checked')?.value || 'linepay';
  const name = $('#name').value.trim();
  const phone= $('#phone').value.trim();
  const email= $('#email').value.trim();
  const ship = $('#ship').value;
  const addr = ship==='宅配' ? $('#addr').value.trim() : '';
  const remark=$('#remark').value.trim();
  if(!name || !phone || !email || (ship==='宅配' && !addr)){
    toast('請完整填寫收件資料'); return;
  }
  if(!$('#agree').checked){ toast('請勾選已閱讀物流須知'); return; }

  // 組合訂單
  const items = cart.items.map(it=>({
    title: PRODUCTS[it.sku].title,
    weight: '10斤',
    size: it.spec,
    price: PRODUCTS[it.sku].price,
    qty: it.qty
  }));
  if(items.length===0){ toast('購物車是空的'); return; }

  const payload = {
    name, phone, email, ship, addr, remark,
    items,
    summary:{
      subtotal: cart.subtotal(),
      shipping: cart.shipping(cart.subtotal() - cart.discount()),
      total: cart.total()
    },
    payMethod: pay
  };

  // 防呆提示
  const btn = $('#checkout');
  const tips = $('#payTips');
  btn.disabled = true; tips.textContent = '送出訂單中，請稍候…';

  try{
    const res = await fetch(GAS_ENDPOINT, { method:'POST', mode:'cors', body: JSON.stringify(payload) });
    const json = await res.json();

    if(!json.ok){ throw new Error(json.msg||'下單失敗'); }

    // LINE Pay 流程：依裝置開 appUrl，再回退 webUrl
    if(pay==='linepay' && json.linepay){
      const app = json.linepay.appUrl, web = json.linepay.webUrl;
      // 嘗試開啟 LINE App
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if(isMobile && app){
        window.location.href = app;
        // 2秒內未成功，回退 web
        setTimeout(()=>{ if(document.visibilityState!=='hidden' && web){ window.open(web, '_blank'); } }, 1800);
      }else if(web){
        window.open(web, '_blank');
      }
      tips.textContent = '已導向 LINE Pay，如無法開啟請稍後再試或改用匯款/自取。';
    }else{
      // 匯款/自取
      tips.textContent = '訂單已送出，我們將盡快為您處理。';
    }

    // 不自動清空，避免付款失敗資料遺失；給使用者自行操作
  }catch(err){
    tips.textContent = '送出失敗：' + err.message;
    btn.disabled = false;
    return;
  }
});

/* ========== 左側「買過都說讚」：100 則不重複 ========== */
function genReviews(){
  const surnames = ['陳','林','黃','張','李','王','吳','劉','蔡','楊','許','鄭','謝','郭','洪','邱','曾','賴','周','簡'];
  const who = (i)=> `${surnames[i%surnames.length]}${['先生','小姐'][i%2]}`;
  const msgs = [
    '沒吃過這麼好吃的椪柑','果香很乾淨','小朋友超愛','一箱很快就吃完','冷藏更甜更清爽',
    '皮薄好剝','甜中帶點果酸剛好','送禮有面子','果肉細嫩','回購第三年',
    '酸甜平衡不膩口','汁很多很過癮','每顆都有水準','家人都稱讚','值得等成熟再採',
    '今年特別好','橙香很明顯','多汁但不水','吃得到陽光味','已推坑同事'
  ];
  const arr=[]; 
  const year = new Date().getMonth()+1>=10 ? new Date().getFullYear() : new Date().getFullYear()-1;
  // 產季（10~3）各月隨機 16~18 筆
  for(let i=0;i<100;i++){
    const mset = [10,11,12,1,2,3];
    const m = mset[i % mset.length];
    const y = m>=10? year : year+1;
    const d = String( (i%27)+1 ).padStart(2,'0');
    const star = (i===7 || i===45) ? 3 : ( (i%9===0) ? 4 : 5 ); // 僅 2 則 3★
    const name = who(i);
    const text = msgs[(i*7)%msgs.length];
    arr.push({date:`${y}-${String(m).padStart(2,'0')}-${d}`, name, star, text});
  }
  return arr;
}
function mountReviews(){
  const data = genReviews();
  const track = $('#reviewsTrack');
  track.innerHTML = data.map(r=>`
    <div class="review-card">
      <div class="review-meta"><span>${r.date}</span><span>${r.name}</span></div>
      <div class="review-text">${'★'.repeat(r.star)}${'☆'.repeat(5-r.star)}　${r.text}</div>
    </div>`).join('');
  // dots
  const dots = $('#reviewsDots'); const pages = data.length;
  dots.innerHTML = Array.from({length: Math.ceil(pages)}).slice(0,8).map((_,i)=>`<button data-i="${i}" ${i===0?'class="on"':''}></button>`).join('');
  // 簡易跑馬：每 3 秒下一張
  let idx=0;
  setInterval(()=>{
    idx = (idx+1) % data.length;
    track.scrollTo({left: track.clientWidth*idx, behavior:'smooth'});
  }, 3000);
}
$('#reviewsToggle').addEventListener('click', ()=>$('#reviewsPanel').classList.add('open'));
$('#reviewsClose').addEventListener('click', ()=>$('#reviewsPanel').classList.remove('open'));

/* ========== 查訂單浮窗 ========== */
const osp = $('#orderSearchPop');
$('#orderSearchBtn').addEventListener('click', ()=>osp.classList.toggle('open'));
$('#ospClose').addEventListener('click', ()=>osp.classList.remove('open'));
$('#ospGo').addEventListener('click', ()=>{
  const no = ($('#ospInput').value||'').trim();
  if(!no) return;
  const url = GAS_ENDPOINT + '?orderNo=' + encodeURIComponent(no);
  window.open(url, '_blank');
});

/* ========== 首次啟動 ========== */
document.addEventListener('DOMContentLoaded', ()=>{
  // 輪播
  $$('[data-carousel]').forEach(mountCarousel);
  // 產季
  buildSeasonLines();
  // 渲染購物車 & 表單記憶
  renderCart(); formMem.load();
  // 左側評論
  mountReviews();
  // 產品價格/庫存動態寫入（保險）
  for(const k of Object.keys(PRODUCTS)){
    document.querySelector(`[data-price="${k}"]`)?.replaceWith(document.createTextNode(PRODUCTS[k].price));
    document.querySelector(`[data-sold="${k}"]`)?.replaceWith(document.createTextNode(PRODUCTS[k].sold));
    document.querySelector(`[data-left="${k}"]`)?.replaceWith(document.createTextNode(PRODUCTS[k].left));
  }
});
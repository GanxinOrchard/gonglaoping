/* ====== 基本設定 ====== */
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbw2Cd6Zw_aaYBxFKY0CkHXlSDQSHWj5sBwTlBtYMuYbN5HZIuRlCPnok83Jy0TIjmfA/exec"; // 你的 Apps Script

/* ====== 工具 ====== */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const money = n => 'NT$ ' + (Math.round(n)||0).toLocaleString('en-US');

/* 防止背景滾動（抽屜開啟時） */
function lockBody(on){ document.body.classList[on?'add':'remove']('gx-lock'); }

/* ====== 輪播掛載（品牌故事、果實近拍、評價） ====== */
function mountCarousel(root){
  const track = $('.c-track', root);
  if(!track) return;
  let index = 0;
  const go = i=>{
    const max = track.children.length-1;
    index = Math.max(0, Math.min(max, i));
    track.scrollTo({left: index*track.clientWidth, behavior:'smooth'});
  };
  $('.c-prev', root)?.addEventListener('click', ()=>go(index-1));
  $('.c-next', root)?.addEventListener('click', ()=>go(index+1));
  let timer = null;
  if (root.getAttribute('data-autoplay') !== 'off'){
    timer = setInterval(()=>{ index=(index+1)%track.children.length; go(index); }, 4000);
    track.addEventListener('pointerdown', ()=>clearInterval(timer), {passive:true});
  }
  track.addEventListener('scroll', ()=>{
    clearTimeout(track._t);
    track._t = setTimeout(()=>{ index = Math.round(track.scrollLeft/track.clientWidth); }, 120);
  }, {passive:true});
}

/* ====== 產季時間軸（移位 + 敘述） ====== */
function buildTimeline(){
  const ponkanActive = [10,11,12,1,2,3,4]; // 椪柑：青皮 10-12；橙皮儲藏 12-4
  const maoguActive  = [12,1,2,3];         // 茂谷：12-3
  const mk = (active, greenFirst=false)=>{
    const frag = document.createDocumentFragment();
    for (let m=1;m<=12;m++){
      const wrap = document.createElement('div'); wrap.className='tl-month';
      const dot = document.createElement('div'); dot.className='tl-dot';
      if (active.includes(m)) dot.classList.add('active');
      if (greenFirst && m===10) dot.classList.add('green'); // 10月偏綠
      const mo = document.createElement('div'); mo.className='tl-mo'; mo.textContent = m+'月';
      const ds = document.createElement('div'); ds.className='tl-desc';
      ds.textContent = active.includes(m) ? (m===10?'青熟上場':'風味佳') : '—';
      wrap.append(dot, mo, ds); frag.append(wrap);
    }
    return frag;
  };
  $('#ponkanMonths').innerHTML='';
  $('#ponkanMonths').appendChild(mk(ponkanActive, true));
  $('#maoguMonths').innerHTML='';
  $('#maoguMonths').appendChild(mk(maoguActive));
}

/* ====== 商品 & 購物車 ====== */
const CARTKEY = 'gx_cart_v2';
let cart = JSON.parse(localStorage.getItem(CARTKEY)||'[]');
let couponState = { code:'', discount:0 };

const SHIPPING_FREE = 1800;
const SHIPPING_FEE  = 120;

/* 折扣碼（到期日要生效） */
const COUPONS = [
  { code:'ORANGE200', type:'flat', amount:200, expire:'2030-12-31' },
  { code:'ORANGE10',  type:'rate', amount:0.9,  expire:'2030-12-31' }
];
function isExpired(dateStr){ return new Date() > new Date(dateStr+'T23:59:59'); }

function save(){ localStorage.setItem(CARTKEY, JSON.stringify(cart)); renderCart(); }

/* 加入購物車（不自動打開） */
function addToCart(sku, spec, price, title){
  const key = `${sku}|${spec}|${price}`;
  const found = cart.find(x=>x.key===key);
  if (found) found.qty += 1;
  else cart.push({ key, sku, spec, price, title, qty:1 });
  save();
  flashSubmitMsg('已加入購物車，點右下🛒查看', 'ok');
}

/* 渲染購物車 */
function renderCart(){
  const wrap = $('#cartList'); wrap.innerHTML='';
  let subtotal = 0;
  cart.forEach((it, idx)=>{
    const li = document.createElement('div'); li.className='cart-item';
    const img = document.createElement('img');
    img.src = 'https://raw.githubusercontent.com/GanxinOrchard/gonglaoping/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png';
    img.alt = it.title;
    const info = document.createElement('div');
    info.innerHTML = `<h4>${it.title}</h4><div class="muted">${it.spec}</div><div class="muted">${money(it.price)}</div>`;
    const qty = document.createElement('div'); qty.className='qty';
    const minus = document.createElement('button'); minus.textContent='–';
    const span = document.createElement('span'); span.textContent = it.qty;
    const plus = document.createElement('button'); plus.textContent='+';
    const del = document.createElement('button'); del.textContent='×'; del.style.marginLeft='6px';
    minus.onclick=()=>{ it.qty=Math.max(1,it.qty-1); save(); };
    plus.onclick =()=>{ it.qty+=1; save(); };
    del.onclick  =()=>{ cart.splice(idx,1); save(); };
    qty.append(minus,span,plus,del);
    li.append(img,info,qty);
    wrap.append(li);
    subtotal += it.qty*it.price;
  });

  // 運費與折扣
  let shipping = subtotal>=SHIPPING_FREE || subtotal===0 ? 0 : SHIPPING_FEE;
  let discount = couponState.discount||0;
  const total = Math.max(0, subtotal + shipping - discount);

  $('#sumSubtotal').textContent = money(subtotal);
  $('#sumShipping').textContent = money(shipping);
  $('#sumDiscount').textContent = discount ? '– ' + money(discount) : '– NT$ 0';
  $('#sumTotal').textContent = money(total);
}

/* 折扣碼套用 */
function applyCoupon(){
  const code = $('#coupon').value.trim().toUpperCase();
  const c = COUPONS.find(x=>x.code===code);
  const msg = $('#couponMsg');
  if (!c){ couponState={code:'',discount:0}; msg.textContent='無效的折扣碼'; renderCart(); return; }
  if (isExpired(c.expire)){ couponState={code:'',discount:0}; msg.textContent='折扣碼已過期'; renderCart(); return; }

  // 先算目前小計
  const subtotal = cart.reduce((s,it)=>s+it.qty*it.price,0);
  let discount = 0;
  if (c.type==='flat') discount = c.amount;
  if (c.type==='rate') discount = Math.round(subtotal*(1-c.amount));
  couponState = { code:c.code, discount: Math.min(discount, subtotal) };
  msg.textContent = `已套用：${c.code}`;
  renderCart();
}

/* 送出訂單 */
async function submitOrder(){
  if (!$('#agree').checked){ flashSubmitMsg('請先閱讀並勾選「物流須知」', 'err'); return; }
  if (cart.length===0){ flashSubmitMsg('購物車是空的', 'err'); return; }
  const name=$('#name').value.trim(), phone=$('#phone').value.trim(),
        email=$('#email').value.trim(), ship=$('#ship').value, addr=$('#addr').value.trim(),
        remark=$('#remark').value.trim();
  if (!name||!phone||!email||!addr){ flashSubmitMsg('請完整填寫收件資訊', 'err'); return; }

  // 彙整金額
  const subtotal = cart.reduce((s,it)=>s+it.qty*it.price,0);
  const shipping = subtotal>=SHIPPING_FREE?0:SHIPPING_FEE;
  const discount = couponState.discount||0;
  const total = Math.max(0, subtotal+shipping-discount);

  // 組 payload
  const items = cart.map(it=>({
    title: it.sku==='ponkan'?'椪柑 10台斤':'茂谷柑 10台斤',
    weight: '10台斤',
    size: it.spec,
    price: it.price,
    qty: it.qty
  }));

  const payMethod = $$('input[name="pay"]').find(x=>x.checked)?.value || 'bank';

  const payload = {
    name, phone, email, ship, addr, remark,
    items,
    payMethod,
    summary:{ subtotal, shipping, discount, total }
  };

  // 防呆提示
  flashSubmitMsg('送出訂單中，請稍候…', 'info');

  try{
    const res = await fetch(GAS_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (!json.ok){
      flashSubmitMsg('下單失敗：'+(json.msg||'系統忙碌'), 'err');
      return;
    }

    const orderNo = json.order_no;

    // LINE Pay：行動裝置優先 appUrl，失敗退回 webUrl；沒完成付款就不要寄信（後端已處理：只有確認成功才標示已匯款）
    if (payMethod==='linepay' && json.linepay){
      const { webUrl, appUrl } = json.linepay;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let opened = false;
      if (isMobile && appUrl){
        try{ window.location.href = appUrl; opened=true; }catch(_){}
      }
      if (!opened && webUrl){
        window.location.href = webUrl;
      }
      // 不清空購物車，待付款完成回來再讓使用者自行清空
      flashSubmitMsg('已前往 LINE Pay，若未完成付款可回本頁重試。', 'ok');
      return;
    }

    // 匯款或自取：顯示成功，清空購物車
    flashSubmitMsg(`下單成功！訂單編號：${orderNo}`, 'ok');
    cart = []; couponState={code:'',discount:0}; save();
  }catch(e){
    console.error(e);
    flashSubmitMsg('連線異常，請稍後再試', 'err');
  }
}

function flashSubmitMsg(text, type){
  const box = $('#submitMsg');
  box.textContent = text;
  box.style.color = type==='err' ? '#dc2626' : type==='ok' ? '#16a34a' : '#374151';
}

/* ====== 介面綁定 ====== */
function bindUI(){
  // 產品「加入購物車」：不自動打開購物車
  $$('.prod-card').forEach(card=>{
    const sku = card.dataset.sku;
    const price = Number($('[data-price]', card).textContent);
    const title = $('.prod-title', card).textContent.trim();
    $('[data-add]', card)?.addEventListener('click', ()=>{
      const spec = $('[data-spec]', card).value;
      addToCart(sku, spec, price, title);
    });
  });

  // 浮動按鈕
  $('#btnCart').onclick = ()=>{ $('#cartDrawer').classList.add('open'); lockBody(true); };
  $('#cartClose').onclick = ()=>{ $('#cartDrawer').classList.remove('open'); lockBody(false); };
  $('#cartClear').onclick = ()=>{ if(confirm('確定要清空購物車？')){ cart=[]; couponState={code:'',discount:0}; save(); } };

  // 折扣碼
  $('#applyCoupon').onclick = (e)=>{ e.preventDefault(); applyCoupon(); };

  // 送出訂單
  $('#submitOrder').onclick = submitOrder;

  // 回到頂部
  $('#toTop').onclick = ()=>window.scrollTo({top:0,behavior:'smooth'});

  // 訂單查詢
  const dlg = $('#queryModal');
  $('#btnQuery').onclick = ()=>dlg.showModal();
  dlg.addEventListener('close', ()=>$('#qResult').textContent='');
  $('#doQuery').onclick = async (e)=>{
    e.preventDefault();
    const no = $('#qOrderNo').value.trim();
    if (!no){ $('#qResult').textContent='請輸入訂單編號'; return; }
    try{
      const u = new URL(GAS_ENDPOINT);
      u.searchParams.set('orderNo', no);
      const r = await fetch(u); const j = await r.json();
      $('#qResult').textContent = JSON.stringify(j, null, 2);
    }catch(err){ $('#qResult').textContent = '查詢失敗'; }
  };
}

/* ====== 產生 100 則不重複好評（每年採收期自動換年） ====== */
function buildReviews(){
  const track = $('#reviewsTrack');
  if (!track) return;
  const surnames = ['陳','林','黃','張','李','王','吳','劉','蔡','楊','許','鄭','謝','郭','洪','曾','邱','廖','賴','徐'];
  const comments = [
    '沒吃過這麼好吃的椪柑','果汁超多，小孩超愛','冷藏後更清爽','一箱打開香氣就出來了','酸甜平衡剛剛好',
    '每顆大小穩定','送禮很體面','皮好剝不沾手','今年這批真的很讚','拆箱就聞到油胞香','甜度高但不膩',
    '果肉細嫩','家人說要再回購','比外面賣場好太多','服務很好到貨很快','理賠說明很清楚','一顆接一顆停不下來',
    '做成果汁超順口','沒有雜味','果皮很香','甜而不膩','品質很穩定','長輩也喜歡','孩子說是快樂橘子',
    '直播買過回不去','回購第三年了','朋友收禮很開心','青皮也很好吃','隔天到貨新鮮','果香超明顯',
    '果瓣完整不亂飛','好剝超療癒','吃得到陽光味道','果農很用心','包裝很穩','價錢合理','家人搶著吃',
    '汁水直接滴出來','口感很細緻','多汁清爽','剝開就香','真的有在挑','甜到笑','顆顆飽滿','很耐吃',
    '下次想試茂谷','今年必買','吃了會想念','這批超穩','甜香帶花香','一打開全家都圍上來','剛剛好的酸',
    '甜度有檢測安心','祖傳園子就是棒','冷鏈很穩','到貨很乾淨','皮薄汁多','CP值高','連續下單兩箱','口碑果園'
  ];
  const year = new Date().getMonth()+1 >= 10 ? new Date().getFullYear() : new Date().getFullYear()-1; // 10月開季
  const months = [10,11,12,1,2,3,4]; // 採收期展示

  const elems = [];
  while (elems.length < 100){
    const s = surnames[Math.floor(Math.random()*surnames.length)];
    const who = s + '先生';
    const txt = comments[(elems.length*7 + 3) % comments.length] + (Math.random()<.25?'！':'。');
    // 3星兩則，其他 4~5 星
    const stars = elems.length<2 ? 3 : (Math.random()<.6?5:4);
    const mm = months[elems.length % months.length];
    const dd = String( (elems.length*3)%28 + 1 ).padStart(2,'0');
    const date = `${mm>=10?year:year+1}-${String(mm).padStart(2,'0')}-${dd}`;
    const card = document.createElement('article');
    card.className='review-card';
    card.innerHTML = `
      <div class="review-head">
        <div class="review-name">${who}</div>
        <div class="stars">${'🟠'.repeat(stars)}${'⚪'.repeat(5-stars)}</div>
        <div class="review-date">${date}</div>
      </div>
      <div class="review-text">${txt}</div>
    `;
    elems.push(card);
  }
  elems.forEach(el=>track.appendChild(el));
}

/* ====== 啟動 ====== */
window.addEventListener('DOMContentLoaded', ()=>{
  // 輪播
  document.querySelectorAll('[data-carousel], .carousel').forEach(mountCarousel);
  // 產季
  buildTimeline();
  // 購物車
  renderCart(); bindUI();
  // 評價
  buildReviews();
});
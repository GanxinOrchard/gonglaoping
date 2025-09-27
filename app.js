/* ===== 工具 ===== */
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));

/* ===== 故事輪播 ===== */
(function(){
  const wrap=$('.story'); if(!wrap) return;
  const track=$('.s-track',wrap); const cards=$$('.s-card',track);
  let i=0;
  function go(n){ i=(n+cards.length)%cards.length; track.scrollTo({left:wrap.clientWidth*i,behavior:'smooth'}); }
  $('.s-arrow.prev',wrap).onclick=()=>go(i-1);
  $('.s-arrow.next',wrap).onclick=()=>go(i+1);
})();

/* ===== 近拍輪播 ===== */
(function(){
  const wrap=$('.closeup'); if(!wrap) return;
  const track=$('.c-track',wrap); const items=$$('.c-item',track);
  let i=0;
  function go(n){ i=(n+items.length)%items.length; track.scrollTo({left:wrap.clientWidth*i,behavior:'smooth'}); }
  $('.c-arrow.prev',wrap).onclick=()=>go(i-1);
  $('.c-arrow.next',wrap).onclick=()=>go(i+1);
})();

/* ===== 條狀圖（甜/酸/香）＋ 規格尺寸 ===== */
const specMap={
  ponkan:{ base:{sweet:.8,acid:.35,aroma:.7}, size:{'23A':'直徑約 7.0–7.5 cm','25A':'直徑約 7.6–8.0 cm','27A':'直徑約 8.1–8.5 cm','30A':'直徑約 8.6–9.0 cm'} },
  maogu:{  base:{sweet:.85,acid:.4,aroma:.8}, size:{'23A':'直徑約 6.8–7.3 cm','25A':'直徑約 7.4–7.9 cm','27A':'直徑約 8.0–8.4 cm','30A':'直徑約 8.5–9.0 cm'} }
};
function updateMeters(card,key){
  const v=$('.spec',card)?.value||'25A';
  const base=specMap[key].base;
  const adj=(v==='23A'?-0.05:(v==='27A'?0.03:(v==='30A'?0.05:0)));
  $$('.bar',card).forEach(b=>{
    const k=b.dataset.k; const val=Math.max(.05,Math.min(1,base[k]+adj));
    b.style.setProperty('--val',val);
  });
}
function initMeters(){
  $$('.card').forEach(card=>{
    const sel=$('.spec',card); if(!sel) return;
    const key=sel.dataset.product; if(!specMap[key]) return;
    sel.addEventListener('change',()=>updateMeters(card,key));
    updateMeters(card,key);
  });
}
document.addEventListener('DOMContentLoaded',initMeters);

/* ===== 浮動面板：購物車/評論 ===== */
const cartPanel=$('#cartPanel'), reviewsPanel=$('#reviewsPanel');
$('.cart-toggle')?.addEventListener('click',()=>cartPanel.classList.toggle('open'));
$('.reviews-toggle')?.addEventListener('click',()=>reviewsPanel.classList.toggle('open'));
$('.close-cart')?.addEventListener('click',()=>cartPanel.classList.remove('open'));
$('.clear-cart')?.addEventListener('click',()=>clearCart());
$('.reviews .close')?.addEventListener('click',()=>reviewsPanel.classList.remove('open'));

/* ===== 加入購物車（不自動開；顯示 toast） ===== */
const toast=$('#toast');
function showToast(t){ if(!toast) return; toast.textContent=t; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1500); }

const CART_KEY='gx_cart_v1';
function getCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(_){return[]} }
function saveCart(d){ localStorage.setItem(CART_KEY,JSON.stringify(d)); renderCart(); }

function addToCart(btn){
  const id=btn.dataset.id, title=btn.dataset.title, price=Number(btn.dataset.price)||0;
  const card=btn.closest('.card'); const spec=$('.spec',card)?.value||'';
  const key=id+'|'+spec; const cart=getCart();
  const found=cart.find(x=>x.key===key);
  if(found){found.qty+=1;} else {cart.push({key,id,title,spec,price,qty:1});}
  saveCart(cart);
  showToast('已加入購物車');
}
$$('.btn.add').forEach(b=>b.addEventListener('click',e=>addToCart(e.currentTarget)));

/* ===== 購物車渲染 ===== */
const elItems=$('.cart-items'), elSubtotal=$('#sumSubtotal'), elShipping=$('#sumShipping'), elDiscount=$('#sumDiscount'), elTotal=$('#sumTotal');

function renderCart(){
  const cart=getCart(); if(!elItems) return;
  elItems.innerHTML= cart.length? '' : '<div class="muted">購物車是空的</div>';
  let subtotal=0;
  cart.forEach((it,idx)=>{
    subtotal += it.price*it.qty;
    const row=document.createElement('div'); row.className='ci';
    row.innerHTML=`
      <div class="ci-title">${it.title}｜${it.spec}</div>
      <div class="ci-ctrl">
        <button class="qbtn minus">–</button>
        <span class="qty">${it.qty}</span>
        <button class="qbtn plus">＋</button>
        <b class="amt">NT$ ${(it.price*it.qty).toLocaleString()}</b>
        <button class="qbtn del">移除</button>
      </div>`;
    $('.minus',row).onclick=()=>{ if(it.qty>1){it.qty--; saveCart(cart);} };
    $('.plus',row).onclick=()=>{ it.qty++; saveCart(cart); };
    $('.del',row).onclick=()=>{ cart.splice(idx,1); saveCart(cart); };
    elItems.appendChild(row);
  });
  const shipping = subtotal>=1800 ? 0 : (subtotal>0?150:0);
  const {discount}=getDiscount(subtotal);
  const total=Math.max(0, subtotal+shipping-discount);
  elSubtotal.textContent='NT$ '+subtotal.toLocaleString();
  elShipping.textContent='NT$ '+shipping.toLocaleString();
  elDiscount.textContent='- NT$ '+discount.toLocaleString();
  elTotal.textContent='NT$ '+total.toLocaleString();

  $('#btnSubmit').disabled = !( $('#agreeRules')?.checked && cart.length>0 );
}
renderCart();
$('#agreeRules')?.addEventListener('change',renderCart);

/* ===== 折扣碼（GX200OFF 現折200；GX10OFF 九折；當季且未過期） ===== */
const COUPON_KEY='gx_coupon_v1';
function setCoupon(c){localStorage.setItem(COUPON_KEY,(c||'').trim().toUpperCase()); renderCart();}
function getCoupon(){return (localStorage.getItem(COUPON_KEY)||'').toUpperCase();}
function inSeason(){ const m=new Date().getMonth()+1; return (m>=10 || m<=4); } // 10~4
function notExpired(){ const now=new Date(); const end=new Date(now.getFullYear(),3,30,23,59,59); return now<=end; }
function getDiscount(subtotal){
  const code=getCoupon(); let discount=0,msg='';
  if(!code) return {discount,msg};
  if(!inSeason()) {msg='非當季，折扣碼無法使用'; return {discount,msg};}
  if(!notExpired()) {msg='折扣碼已過期'; return {discount,msg};}
  if(code==='GX200OFF'){ discount=Math.min(200, subtotal); msg=discount>0?'已套用：現折200':'金額不足以折抵'; }
  else if(code==='GX10OFF'){ discount=Math.round(subtotal*0.1); msg=discount>0?'已套用：九折':'金額不足以折抵'; }
  else { msg='無效的折扣碼'; }
  return {discount,msg};
}
$('#applyCoupon')?.addEventListener('click',()=>{
  const code=$('#coupon').value.trim().toUpperCase(); setCoupon(code);
  const msgBox=$('#couponMsg'); const {discount,msg}=getDiscount(getCart().reduce((s,i)=>s+i.price*i.qty,0));
  if(msgBox){ msgBox.textContent=msg || (discount>0?'已套用':''); msgBox.className='coupon-msg '+(discount>0?'ok':'err'); }
});
$('#coupon')?.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#applyCoupon').click(); }})

/* ===== 送出訂單（防呆文案 + LINE Pay appUrl 優先） ===== */
const GAS=(typeof window!=='undefined' && window.GAS_ENDPOINT)||'';
$('#checkoutForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('#btnSubmit'), hint=$('#submitHint');
  if(btn){btn.disabled=true; btn.textContent='送出訂單中，請稍候…';}
  if(hint) hint.textContent='系統處理中，請勿關閉或重新整理';

  try{
    const cart=getCart(); if(!cart.length) throw new Error('購物車是空的');
    const fd=new FormData(e.currentTarget);
    const payload={
      name:fd.get('name')||'', email:fd.get('email')||'', phone:fd.get('phone')||'',
      ship:fd.get('ship')||'宅配', addr:fd.get('addr')||'', remark:fd.get('remark')||'',
      items:cart.map(it=>({title:it.title,weight:'10斤',size:it.spec,price:it.price,qty:it.qty})),
      summary:calcSummary(), payMethod:(fd.get('pay')||'bank').toLowerCase()
    };
    if(!GAS) throw new Error('未設定後端 API');

    const r=await fetch(GAS,{method:'POST',body:JSON.stringify(payload)});
    const json=await r.json();
    if(!json.ok) throw new Error(json.msg||'下單失敗，請稍後再試');

    const orderNo=json.order_no;
    if(payload.payMethod==='linepay' && json.linepay){
      const isMobile=/iPhone|iPad|Android/i.test(navigator.userAgent);
      const appUrl=json.linepay.appUrl, webUrl=json.linepay.webUrl;
      if(isMobile && appUrl){ location.href=appUrl; setTimeout(()=>{ if(document.visibilityState==='visible' && webUrl) location.href=webUrl; },1800); }
      else if(webUrl){ location.href=webUrl; }
      // 不清空，待回調成功再由 GAS 標記
    }else{
      clearCart();
      alert('訂單已送出！訂單編號：'+orderNo);
    }
  }catch(err){
    alert(err.message||String(err));
  }finally{
    if(btn){ btn.disabled=!( $('#agreeRules')?.checked && getCart().length>0 ); btn.textContent='送出訂單'; }
    if(hint) hint.textContent='';
  }
});
function calcSummary(){
  const cart=getCart(); const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping=subtotal>=1800?0:(subtotal>0?150:0);
  const {discount}=getDiscount(subtotal);
  return {subtotal,shipping,discount,total:Math.max(0,subtotal+shipping-discount)};
}
function clearCart(){ localStorage.removeItem('gx_cart_v1'); renderCart(); }

/* ===== 動態評論：100 則（每年當季） ===== */
(function(){
  const box=$('#reviewsList'); if(!box) return;
  const namesM=['陳先生','林先生','王先生','吳先生','張先生','蔡先生','徐先生','許先生','李先生','周先生','黃先生','梁先生','柯先生','蕭先生','曾先生','鄭先生','邱先生','鍾先生','朱先生','洪先生'];
  const namesF=['陳小姐','林小姐','王小姐','吳小姐','張小姐','蔡小姐','徐小姐','許小姐','李小姐','周小姐','黃小姐','梁小姐','柯小姐','蕭小姐','曾小姐','鄭小姐','邱小姐','鍾小姐','朱小姐','洪小姐'];
  const pool=namesM.concat(namesF);
  const phrases=[
    '沒吃過這麼好吃的椪柑','果香很乾淨','孩子超喜歡','冷藏更清爽','甜度穩定','幾乎沒在踩雷',
    '手剝超療癒','多汁不膩','回購第三年','送禮很有面子','汁水超多','顆顆完整',
    '拆箱有香氣','沒有藥味','油胞香氣很明顯','果肉細嫩','酸甜平衡','老欉真的穩',
    '批次穩定','物超所值','家人都說讚','清甜順口','甜但不膩','口感很細',
    '果皮好剝','榨汁也好喝','小孩搶著吃','會再回購','包裝穩固','物流很快',
    '客服很貼心','產地直送新鮮','每瓣都漂亮','沒有乾癟果','香氣迷人','肉質很細',
    '甜度夠','果汁飽滿','不苦不澀','柑香明顯','吃得到陽光','回購清單第一名'
  ];
  const months=[10,11,12,1,2,3];
  function r(a){return a[Math.floor(Math.random()*a.length)];}
  function rDate(){
    const y=new Date().getFullYear(), m=r(months), d=String(Math.max(1,Math.min(28,Math.floor(Math.random()*28)+1))).padStart(2,'0');
    const mm=String(m).padStart(2,'0'); return `${y}-${mm}-${d}`;
  }
  const list=[];
  for(let i=0;i<100;i++){
    const star = i<2 ? 3 : (i%15===0 ? 4 : 5);
    list.push({name:r(pool), date:rDate(), star, text:r(phrases)});
  }
  list.forEach(rw=>{
    const el=document.createElement('div'); el.className='rv';
    el.innerHTML=`<div class="rv-h"><span class="rv-name">${rw.name}</span><span class="rv-date">${rw.date}</span><span class="rv-stars">${'🍊'.repeat(rw.star)}</span></div><div class="rv-t">${rw.text}</div>`;
    box.appendChild(el);
  });
})();

/* ===== 鍵盤可用性：導引平滑 ===== */
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=$(a.getAttribute('href')); if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
  });
});

/* ===== iOS 防放大：已在 CSS input font-size:16px ===== */
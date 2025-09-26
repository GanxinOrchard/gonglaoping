/*****************
 * 設定（換圖只改這裡）
 *****************/
const CONFIG = {
  BRAND_TAG: "柑心果園",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzT7yzMZXqjpJq_AvbcCKUrZaH3-N74YoRdsj3c4V2gfhD5Rbdnf3oucVvnextsrbhu/exec",
  SHIPPING: 160,
  FREE_SHIP_THRESHOLD: 1800,
  PAY: { currency: 'TWD' }, // LINE Pay 金鑰在 GAS
  BANK: { name: "連線銀行(824)", holder: "張鈞泓", no: "11101-37823-13" },
  IMAGES: {
    HERO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E5%B0%81%E9%9D%A2%E5%9C%96.png"),
    PRODUCT10: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/10%E6%96%A4%E7%94%A2%E5%93%81%E5%9C%96%E7%89%87.png"),
    FRUIT_PONGAN: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E6%A4%AA%E6%9F%91%E6%9E%9C%E5%AF%A6.jpg"),
    FRUIT_MAOGAO: toRaw("https://github.com/GanxinOrchard/gonglaoping/blob/main/%E8%8C%82%E8%B0%B7%E6%9F%91.png")
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

/*****************
 * 商品 / 指南
 *****************/
const PRODUCTS = {
  PONGAN: { section:'PONGAN', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(size)=>`PON10-${size}`, title:"椪柑" },
  MAOGAO: { section:'MAOGAO', weight:'10台斤', sizes:["23A","25A","27A","30A"], getId:(size)=>`MAO10-${size}`, title:"茂谷" }
};
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' };

// 品種×規格 → 量表與關鍵詞
const GUIDE_META = {
  PONGAN: {
    "23A": { sweet:3.9, sour:2.3, aroma:3.0, chips:['脆','多汁','清爽'] },
    "25A": { sweet:4.1, sour:2.1, aroma:3.1, chips:['脆','多汁','清爽'] },
    "27A": { sweet:4.3, sour:2.0, aroma:3.2, chips:['順口','多汁','清爽'] },
    "30A": { sweet:4.5, sour:1.9, aroma:3.3, chips:['香甜','多汁','柔和'] }
  },
  MAOGAO: {
    "23A": { sweet:4.2, sour:2.7, aroma:3.6, chips:['細嫩','爆汁','清香'] },
    "25A": { sweet:4.4, sour:2.5, aroma:3.8, chips:['柔嫩','爆汁','香甜'] },
    "27A": { sweet:4.5, sour:2.3, aroma:4.0, chips:['柔嫩','爆汁','香濃'] },
    "30A": { sweet:4.6, sour:2.2, aroma:4.1, chips:['極嫩','爆汁','濃香'] }
  }
};

/*****************
 * 工具
 *****************/
function toRaw(u){ return !u ? u : (u.includes('raw.githubusercontent.com') ? u : u.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')); }
const currency = n => "NT$ "+(n||0).toLocaleString();
const priceOf = (section,weight,size)=> CONFIG.PRICES[section]?.[weight]?.[size] ?? 0;
function statusOf(id){ return CONFIG.STATUS[id] || 'normal'; }
function go(e,id){ if(e) e.preventDefault(); const el=document.getElementById(id); if(!el) return; const navH=document.querySelector('.subnav.top')?.offsetHeight||0; const y=el.getBoundingClientRect().top+scrollY-navH-6; scrollTo({top:y,behavior:'smooth'}); }

/*****************
 * Hero
 *****************/
function mountHero(){ document.getElementById('heroImg').src = CONFIG.IMAGES.HERO; }

/*****************
 * 規格籤 / 價格 / 庫存
 *****************/
function renderSpecChips(kind){
  const conf=PRODUCTS[kind]; const rail=document.getElementById('spec-'+kind.toLowerCase());
  rail.innerHTML = conf.sizes.map(s=>`<button class="spec ${SELECTED[kind]===s?'active':''}" onclick="selectSpec('${kind}','${s}')">${conf.weight}｜${s}</button>`).join('');
  document.getElementById('price-'+kind.toLowerCase()).textContent = currency(priceOf(conf.section, conf.weight, SELECTED[kind]));
  const pid = conf.getId(SELECTED[kind]); const inv = CONFIG.INVENTORY[pid]||{sold:0,stock:0};
  document.getElementById('inv-'+kind.toLowerCase()).textContent = `已售出 ${inv.sold}　剩餘 ${inv.stock} 箱`;
}
function selectSpec(kind,size){ SELECTED[kind]=size; renderSpecChips(kind); }

/*****************
 * 購物車（僅宅配）
 *****************/
const LS = { cart:'gx_cart', form:'gx_form' };
const cart = (()=>{ try{ const s=localStorage.getItem(LS.cart); return s? JSON.parse(s):[]; }catch{ return []; } })();
function saveCart(){ localStorage.setItem(LS.cart, JSON.stringify(cart)); }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }
function toggleCart(open){ const d=document.getElementById('cartDrawer'); d.classList.toggle('open', !!open); if(open){ document.addEventListener('keydown',escCloseCart); } else { document.removeEventListener('keydown',escCloseCart); } }
function escCloseCart(e){ if(e.key==='Escape') toggleCart(false); }
function toggleQuery(open){ document.getElementById('queryDrawer').classList.toggle('open', !!open); }
function bumpFab(){ const f=document.getElementById('cartFab'); f.style.transform='scale(1.05)'; setTimeout(()=>f.style.transform='',180); }

function addToCart(pid,title,price,weight,size,section){
  if(statusOf(pid)==='soldout'){ showToast('此品項已售完'); return; }
  const existed = cart.find(x=>x.id===pid);
  if(existed) existed.qty++;
  else cart.push({ id:pid, title, price, qty:1, weight, size, section });
  saveCart(); renderCart(); bumpFab(); showToast('已加入購物車');
}
function addSelected(kind){
  const c=PRODUCTS[kind], size=SELECTED[kind], pid=c.getId(size), price=priceOf(c.section,c.weight,size);
  const title=c.title+`｜${c.weight}｜${size}`;
  addToCart(pid,title,price,c.weight,size,c.section);
}
function mutateQty(i,delta){ cart[i].qty+=delta; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); renderCart(); }
function clearCart(){ if(!cart.length) return; if(confirm('確定要清空購物車？')){ cart.length=0; saveCart(); renderCart(); } }
function calc(){ const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0); const shipping=(subtotal>=CONFIG.FREE_SHIP_THRESHOLD || cart.length===0) ? 0 : CONFIG.SHIPPING; return {subtotal,shipping,total:subtotal+shipping}; }
function renderCart(){
  const list=document.getElementById('cartList');
  if(!cart.length){
    list.innerHTML = `<div class="card" style="padding:12px;display:flex;gap:10px;align-items:center;justify-content:center">
      <div class="cart-thumb">🍊</div><div class="muted">購物車是空的，去挑幾顆最頂的橘子吧</div></div>`;
  }else{
    list.innerHTML = cart.map((c,i)=>`
      <div class="cart-item">
        <div class="cart-thumb">🍊</div>
        <div>
          <div><strong>${c.title}</strong></div>
          <div class="muted">${currency(c.price)} × ${c.qty}</div>
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
  document.getElementById('freeShipText').textContent='NT$ '+CONFIG.FREE_SHIP_THRESHOLD.toLocaleString();
}

/*****************
 * 下單 / 付款
 *****************/
function saveForm(){ const f=document.getElementById('orderForm'); const obj=Object.fromEntries(new FormData(f)); localStorage.setItem(LS.form, JSON.stringify(obj)); }
function loadForm(){ try{ const s=localStorage.getItem(LS.form); if(!s) return; const obj=JSON.parse(s); const f=document.getElementById('orderForm'); for(const k in obj){ if(f[k]) f[k].value=obj[k]; } }catch{} }

async function submitOrder(ev){
  ev.preventDefault();
  if(!cart.length){ alert('購物車是空的'); return; }
  const agree=document.getElementById('agree'); if(!agree.checked){ alert('請先閱讀條款並勾選同意'); return; }

  const f=new FormData(ev.target);
  for(const key of ['name','phone','email','addr']) if(!f.get(key)) return alert('請完整填寫訂單資料');

  const payload={
    ts:new Date().toISOString(),
    name:f.get('name'), phone:f.get('phone'), email:f.get('email'),
    addr:f.get('addr'),
    ship:'宅配',
    remark:f.get('remark')||'',
    items: cart.map(c=>({title:c.title, section:c.section, weight:c.weight, size:c.size, price:c.price, qty:c.qty})),
    summary: calc(),
    brand: CONFIG.BRAND_TAG,
    shipMeta:{ method:'HOME' }
  };

  const pay = (document.querySelector('input[name="pay"]:checked')?.value) || 'LINEPAY';
  const btn=document.getElementById('submitBtn'); const res=document.getElementById('result');
  btn.disabled=true; btn.textContent='處理中…'; res.textContent='';

  try{
    // 建立訂單（GAS）
    const r=await fetch(CONFIG.GAS_ENDPOINT, { method:'POST', body: JSON.stringify(payload) });
    const d=await r.json();
    if(!d.ok) throw new Error(d.msg||'建立訂單失敗');
    const orderNo=d.order_no;

    if(pay==='LINEPAY'){
      const req={ orderNo, amount:payload.summary.total, currency:CONFIG.PAY.currency, items:payload.items };
      const r2=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_request',{ method:'POST', body: JSON.stringify(req) });
      const d2=await r2.json();
      if(!d2.ok) throw new Error(d2.msg||'LINE Pay 建立交易失敗');
      localStorage.setItem('gx_lp_orderNo', orderNo);
      localStorage.setItem('gx_lp_amount', String(payload.summary.total));
      location.href = d2.paymentUrl;
      return;
    }else{
      // 匯款：顯示資訊
      res.innerHTML = `✅ 訂單已建立（編號：<b>${orderNo}</b>）。<br>
        請於 24 小時內完成匯款並回報後五碼，我們立即安排出貨。
        <div class="card" style="padding:10px;margin-top:8px">
          <div><b>${CONFIG.BANK.name}</b></div>
          <div>戶名：<b>${CONFIG.BANK.holder}</b></div>
          <div>帳號：<b>${CONFIG.BANK.no}</b></div>
        </div>`;
      cart.length=0; saveCart(); renderCart(); ev.target.reset(); saveForm();
    }
  }catch(e){ res.textContent='送出失敗：'+e.message; }
  finally{ btn.disabled=false; btn.textContent='送出訂單'; }
}

// LINE Pay 回跳確認
(async function handleLinePayReturn(){
  const q=new URLSearchParams(location.search);
  if(q.get('lp')==='return'){
    const orderNo=localStorage.getItem('gx_lp_orderNo');
    const amount=Number(localStorage.getItem('gx_lp_amount')||'0');
    const transactionId=q.get('transactionId');
    if(orderNo && transactionId){
      try{
        const body={ orderNo, transactionId, amount, currency:CONFIG.PAY.currency };
        const r=await fetch(CONFIG.GAS_ENDPOINT+'?action=linepay_confirm',{ method:'POST', body: JSON.stringify(body) });
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
 * 條款同意：需捲底
 *****************/
(function policyAgree(){
  const det=document.getElementById('policy'); const agree=document.getElementById('agree');
  const enableIfBottom=()=>{ const sc=det.scrollTop+det.clientHeight; const need=det.scrollHeight-10; if(sc>=need) agree.disabled=false; };
  det.addEventListener('toggle',()=>{ if(det.open){ det.focus(); }});
  det.addEventListener('scroll',enableIfBottom,{passive:true});
})();

/*****************
 * 訂單查詢
 *****************/
function dateOnly(val){ if(!val) return '—'; try{ const d=new Date(val); if(!isNaN(d)){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; } }catch(e){} return String(val).split(/[ T]/)[0]; }
async function queryOrder(ev){
  ev.preventDefault();
  const f=new FormData(ev.target); const no=(f.get('orderNo')||'').trim();
  const card=document.getElementById('queryCard'); const printBtn=document.getElementById('printBtn');
  card.style.display='block'; card.innerHTML='查詢中…'; printBtn.style.display='none';
  try{
    const r=await fetch(CONFIG.GAS_ENDPOINT+'?orderNo='+encodeURIComponent(no));
    const data=await r.json();
    if(data.ok){
      const s=data.status||'（未提供狀態）';
      const total=data.total?`NT$ ${(data.total||0).toLocaleString()}`:'—';
      const shipDate=data.shipDate?dateOnly(data.shipDate):'—';
      const trackNo=data.trackingNo||'—';
      const hctLink=`<a href="https://www.hct.com.tw/search/searchgoods_n.aspx" target="_blank" rel="noopener">新竹貨運查詢</a>`;
      const items=Array.isArray(data.items)? data.items.map(i=>`${i.title} × ${i.qty}`).join('、') : '—';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <h3 style="margin:0">訂單查詢結果</h3><div class="muted">${new Date().toLocaleString()}</div>
        </div>
        <div class="line"></div>
        <div><b>訂單編號：</b>${no}</div>
        <div><b>目前狀態：</b>${s}</div>
        <div><b>出貨日期：</b>${shipDate}</div>
        <div><b>物流單號：</b>${trackNo}</div>
        <div><b>物流查詢：</b>${hctLink}</div>
        <div><b>金額：</b>${total}</div>
        <div><b>品項：</b>${items}</div>`;
      printBtn.style.display='inline-flex';
    }else card.innerHTML='查無此訂單編號';
  }catch(e){ card.innerHTML='查詢失敗：'+e.message; }
}

/*****************
 * 好評：小圓點五星輪播（更舒適）
 *****************/
function maskName(name){ const s=String(name||'').trim(); if(s.length<=2) return s[0]+'○'; return s[0]+'○'.repeat(s.length-2)+s[s.length-1]; }
function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function seasonalDate(){ const now=new Date(); const y=now.getFullYear(); const start=(now.getMonth()+1)>=11?y:y-1; const a=new Date(start,10,1).getTime(), b=Math.min(now.getTime(), new Date(start+1,2,31).getTime()); const t=a+Math.random()*(b-a); const d=new Date(t); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }
function genFloatReviews(n=40){
  const last="陳林黃張李王吳劉蔡楊許鄭謝郭洪曾周賴徐葉簡鍾宋邱蘇潘彭游傅顏魏高藍".split("");
  const given=["家","怡","庭","志","雅","柏","鈞","恩","安","宥","沛","玟","杰","宗","祺","郁","妤","柔","軒","瑜","嘉","卉","翔","修","均","凱"];
  const txt=["好甜又多汁","剝皮就香","冰過更好吃","大顆穩定","小孩超愛","送禮體面","回購了","清爽不膩"];
  const sizes=["23A","25A","27A","30A"]; const arr=[];
  for(let i=0;i<n;i++){ arr.push({ name:maskName(randPick(last)+randPick(given)+randPick(given)), spec:`10台斤｜${randPick(sizes)}`, date:seasonalDate(), txt:randPick(txt) }); }
  return arr;
}
function starDots(){ return `<span class="rvv-stars"><i></i><i></i><i></i><i></i><i></i></span>`; }
function renderFloatReviews(){
  const track=document.getElementById('rvFloatTrack');
  const list=genFloatReviews(48);
  const row=r=>`<div class="rvv-item">${starDots()}<div><div class="rvv-text">${r.txt}</div><div class="rvv-meta">${r.name}・${r.spec}</div></div></div>`;
  track.innerHTML = list.map(row).join("") + list.map(row).join("");
  const host=document.querySelector('.reviews-float'); const btn=document.querySelector('.rv-toggle');
  if(btn){ btn.addEventListener('click',()=>host.classList.toggle('open')); }
}

/*****************
 * 指南互動（品種＋規格）
 *****************/
function mountGuide(){
  const kindPills=[...document.querySelectorAll('.guide-switch .pill')];
  const sizePills=[...document.querySelectorAll('.size-switch .pill')];
  const bars=[...document.querySelectorAll('.gauge .bar i')];
  const chipsHost=document.getElementById('chipHost');

  let kind='PONGAN', size='23A';

  function setUI(){
    kindPills.forEach(p=>p.classList.toggle('active', p.dataset.kind===kind));
    sizePills.forEach(p=>p.classList.toggle('active', p.dataset.size===size));
    const m=GUIDE_META[kind][size];
    const max=5, w=v=> (v/max*100)+'%';
    bars[0].style.width=w(m.sweet);
    bars[1].style.width=w(m.sour);
    bars[2].style.width=w(m.aroma);
    const iconMap={ '柔嫩':'feather','細嫩':'feather','極嫩':'feather','爆汁':'drop','香甜':'aroma','香濃':'aroma','清香':'aroma','清爽':'drop','順口':'feather','脆':'feather' };
    chipsHost.innerHTML = m.chips.map(t=>`<span class="chip-lg"><i class="icon ${iconMap[t]||'aroma'}"></i>${t}</span>`).join('');
  }
  kindPills.forEach(p=>p.addEventListener('click',()=>{ kind=p.dataset.kind; setUI(); }));
  sizePills.forEach(p=>p.addEventListener('click',()=>{ size=p.dataset.size; setUI(); }));
  setUI();
}

/*****************
 * Admin（簡版 RAW 轉換）
 *****************/
function renderAdmin(){
  const box=document.getElementById('adminBody'); if(!box) return;
  box.innerHTML = `
    <div class="content">
      <p class="muted">貼上 <b>GitHub 檔案頁</b>，點【轉換】取得 RAW 連結。</p>
      <div class="row" style="display:grid;grid-template-columns:1fr auto auto;gap:8px">
        <input id="rawInput" class="input" placeholder="https://github.com/user/repo/blob/main/img.jpg">
        <button class="btn-ghost" type="button" onclick="convertToRaw()">轉換</button>
        <button class="btn-ghost" type="button" onclick="copyRaw()">複製</button>
      </div>
      <div id="rawOutput" class="card" style="display:none;padding:10px;margin-top:8px"></div>
    </div>`;
}
function convertToRaw(){ const input=document.getElementById('rawInput'); if(!input) return; let url=(input.value||'').trim(); if(!url) return alert('請先貼上網址'); const raw=toRaw(url); const out=document.getElementById('rawOutput'); out.style.display='block'; out.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><b>RAW 連結</b><button class="btn-ghost" onclick="copyRaw()">複製</button></div><div class="line"></div><div style="word-break:break-all">${raw}</div>`; input.value=raw; }
async function copyRaw(){ const input=document.getElementById('rawInput'); if(!input) return; const raw=(input.value||'').trim(); if(!raw) return alert('沒有可複製的連結'); try{ await navigator.clipboard.writeText(raw); alert('已複製 RAW 連結'); }catch(e){ alert('複製失敗：'+e.message); } }

/*****************
 * 啟動
 *****************/
function mountImages(){
  document.getElementById('img-pongan').src = CONFIG.IMAGES.PRODUCT10;
  document.getElementById('img-maogao').src = CONFIG.IMAGES.PRODUCT10;
  document.getElementById('img-fruit-pongan').src = CONFIG.IMAGES.FRUIT_PONGAN;
  document.getElementById('img-fruit-maogao').src = CONFIG.IMAGES.FRUIT_MAOGAO;
}
function init(){
  mountHero(); mountImages();
  renderSpecChips('PONGAN'); renderSpecChips('MAOGAO');
  renderCart(); loadForm();
  renderFloatReviews();
  mountGuide();
  renderAdmin();
}
document.addEventListener('DOMContentLoaded', init);

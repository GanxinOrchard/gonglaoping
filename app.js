/* ========= 你的原本設定（CONFIG / PRODUCTS / cart / 下單 / LINE Pay …）保持不動 ========= */
/* 這裡只示範與新功能有關的增補，其他沿用你原檔案。 */

/* ---------- 新：果實近拍輪播 ---------- */
function initCloseups(){
  const rail = document.getElementById('closeupRail');
  const dots = document.getElementById('closeupDots');
  if(!rail || !dots) return;

  const slides = [...rail.children];
  dots.innerHTML = slides.map((_,i)=>`<button data-i="${i}"></button>`).join('');
  const dotBtns = [...dots.querySelectorAll('button')];

  function atIndex(){
    const w = rail.clientWidth;
    const i = Math.round(rail.scrollLeft / Math.max(1,w));
    return Math.max(0, Math.min(slides.length-1, i));
  }
  function setActive(i){
    dotBtns.forEach((b,ix)=>b.classList.toggle('active', ix===i));
    rail.scrollTo({left: i*rail.clientWidth, behavior: 'smooth'});
  }
  dotBtns.forEach((b,i)=> b.addEventListener('click', ()=>setActive(i)));

  document.querySelector('.cu-prev')?.addEventListener('click', ()=>{
    setActive(Math.max(0, atIndex()-1));
  });
  document.querySelector('.cu-next')?.addEventListener('click', ()=>{
    setActive(Math.min(slides.length-1, atIndex()+1));
  });

  let ticking=false;
  rail.addEventListener('scroll', ()=>{
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      dotBtns.forEach((b,ix)=>b.classList.toggle('active', ix===atIndex()));
      ticking=false;
    });
  });
  // 初始
  setActive(0);
}

/* ---------- 量表（甜/酸/香/尺寸）長條渲染：沿用你原本數值 ---------- */
/* 假設你原本有這樣的資料來源（如同上一版 PRICES / 尺寸映射） */
const METER = {
  PONGAN: { sweet:4, sour:2, aroma:3, sizeMap:{ "23A":"約7.0–7.5cm", "25A":"約7.6–8.0cm", "27A":"約8.1–8.5cm", "30A":"約8.6–9.0cm" } },
  MAOGAO: { sweet:4.5, sour:2.5, aroma:4, sizeMap:{ "23A":"約6.8–7.3cm", "25A":"約7.4–7.9cm", "27A":"約8.0–8.4cm", "30A":"約8.5–9.0cm" } }
};
function meterRow(label, val, unit){
  const max = 5;                      // 1~5 滿分
  const pct = Math.min(100, (val/max)*100);
  return `<div class="row"><span>${label}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="unit">${val}/${max}${unit||''}</span></div>`;
}
function meterSizeRow(label, text){
  return `<div class="row"><span>${label}</span><span class="bar"><i style="width:100%"></i></span><span class="unit">${text}</span></div>`;
}
function drawMeters(kind, size){
  const box = document.getElementById(`meter-${kind.toLowerCase()}`);
  if(!box) return;
  const cfg = METER[kind]; if(!cfg) return;
  const sizeText = (cfg.sizeMap && cfg.sizeMap[size]) || '—';
  box.innerHTML =
    meterRow('甜度', cfg.sweet) +
    meterRow('酸度', cfg.sour) +
    meterRow('香氣', cfg.aroma) +
    meterSizeRow('尺寸', sizeText);
}

/* ---------- 與你原本規格選擇鉤在一起 ---------- */
/* 這裡假設你原本有 SELECTED 與 renderSpecChips / selectSpec 函式。只在 selectSpec 結尾加上 drawMeters。 */
const SELECTED = { PONGAN:'25A', MAOGAO:'25A' }; // ← 若原檔已有就用原檔的
function selectSpec(kind, size){
  SELECTED[kind] = size;
  // 你原本的價錢/庫存/按鈕狀態更新……
  renderSpecChips(kind);              // ← 呼叫你原本的
  // 新增：同步更新量表
  drawMeters(kind, size);
}
function renderSpecChips(kind){
  // 你原本的 chips 產生（略），最後記得呼叫 drawMeters
  // …
  drawMeters(kind, SELECTED[kind]);
}

/* ---------- DOM Ready：掛上新功能 ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // 你原本的初始化（購物車渲染、規格初始化、review 生成…）
  // …
  initCloseups();
  // 初始畫一次量表
  drawMeters('PONGAN', SELECTED['PONGAN']);
  drawMeters('MAOGAO', SELECTED['MAOGAO']);

  // 次導覽按鈕平滑捲動（保留原功能）
  document.querySelectorAll('[data-gx-jump]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.preventDefault();
      const sel = btn.getAttribute('data-gx-jump');
      const el  = document.querySelector(sel);
      if(!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - (document.querySelector('.subnav')?.offsetHeight||0) - 6;
      window.scrollTo({top, behavior:'smooth'});
    });
  });
  // 查訂單抽屜（保持你的開關）
  document.querySelectorAll('[data-gx-open="query"]').forEach(b=>{
    b.addEventListener('click', ()=> document.getElementById('queryDrawer')?.classList.add('open'));
  });
  // 購物車 FAB（保持）
  document.getElementById('cartFab')?.addEventListener('click', ()=>{
    document.getElementById('cartDrawer')?.classList.add('open');
  });
});

/* ---------- 其餘：你的 addSelected / addToCart / renderCart / submitOrder 皆沿用 ---------- */
/* 如需我把整份 app.js 連你的 GAS、Line Pay、訂單查詢等一併貼上，也可以；為了做「最小改動」，此處只補新功能。 */
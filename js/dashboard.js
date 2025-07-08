
/* ---------- Prev Close attachment (v7.27) ---------- */
async function attachPrevCloses(){
  const idb = await import('./db/idb.js');
  const now = new Date();
  let d = new Date(now);
  // 找到上一个交易日（跳过周末）
  do{
    d.setDate(d.getDate()-1);
  }while(d.getDay()===0 || d.getDay()===6);
  const dateStr = d.toISOString().slice(0,10);
  // Ensure positions is an array (migration compatibility)
  if(!Array.isArray(positions)){
    try{
      if(typeof recalcPositions==='function'){
        recalcPositions();
      }
    }catch(e){ console.error(e); }
  }
  if(!Array.isArray(positions)){
    console.warn('positions is not iterable, skip prev-close attachment');
    return;
  }
  for(const p of positions){
    const rec = await idb.getPrice(p.symbol, dateStr);
    if(rec && typeof rec.close === 'number'){
      p.prevClose = rec.close;
    }
  }
}


async function getPrevTradingDayClose(symbol){
  const idb = await import('./db/idb.js');
  const now = new Date();
  let d = new Date(now);
  d.setDate(d.getDate()-1);
  while(d.getDay()===0 || d.getDay()===6){ d.setDate(d.getDate()-1); }
  const dateStr = d.toISOString().slice(0,10);
  const rec = await idb.getPrice(symbol, dateStr);
  return rec ? rec.close : null;
}


function buildOptionSymbol(root, dateStr, cp, strike){
  const d = dayjs(dateStr).format('YYMMDD');
  const strikeInt = Math.round(strike * 1000).toString().padStart(8,'0');
  return (root + d + cp + strikeInt).toUpperCase();
}


// ---- Helper: getWeekIdx returns 0 (Sun) - 6 (Sat) using UTC to avoid timezone skew ----
function getWeekIdx(dateStr){
  const parts = dateStr.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1]-1, parts[2])).getUTCDay();
}

/* Trading777 v5.3.2 dashboard – implements import / export, dynamic positions, add‑trade */

(function(){

/* ---------- 1. Data bootstrap ---------- */
const defaultPositions = [{symbol:'AAPL',qty:900,avgPrice:100,last:188.95},{symbol:'TSLA',qty:50,avgPrice:200,last:178.45}];
const defaultTrades = [
 {date:'2025-06-30',symbol:'AAPL',side:'SELL',qty:100,price:220,pl:12000,closed:true},
 {date:'2025-06-30',symbol:'AAPL',side:'BUY',qty:100,price:100,pl:0,closed:false},
 {date:'2025-06-29',symbol:'TSLA',side:'SELL',qty:50,price:210,pl:500,closed:true}
];

let positions = JSON.parse(localStorage.getItem('positions')||'null') || defaultPositions.slice();
if(!Array.isArray(positions)){
  positions = Object.values(positions||{});
}
let trades    = JSON.parse(localStorage.getItem('trades')||'null')    || defaultTrades.slice();
recalcPositions();


/* Save helper */
function saveData(){
  localStorage.setItem('positions',JSON.stringify(positions));
  localStorage.setItem('trades',JSON.stringify(trades));
}

/* ---------- 2. Utils ---------- */
function fmtSign(n){
  const cls=n>0?'green':n<0?'red':'white';
  const val=Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `<span class="${cls}">${n<0?'-':''}${val}</span>`;
}
function fmtDollar(n){return `$ ${fmtSign(n)}`;}
function fmtInt(n){return `<span class="white">${Number(n).toLocaleString()}</span>`;}
function fmtWL(w,l){return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`;}
function fmtPct(p){return `<span class="white">${Number(p).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})}%</span>`;}
const Utils={fmtDollar,fmtInt,fmtWL,fmtPct};

/* ---------- 3. Derived data ---------- */

/* Re‑calc positions by applying trades on top of existing positions */

function recalcPositions(){
  /* 以 FIFO 原则重构持仓与平仓盈亏 */
  const symbolLots = {};   // {SYM: [{qty, price}] }
  const dayStr = new Date().toISOString().slice(0,10);

  trades.sort((a,b)=> new Date(a.date) - new Date(b.date));   // 确保按时间先后

  trades.forEach(t=>{
    const lots = symbolLots[t.symbol] || (symbolLots[t.symbol] = []);
    let remaining = t.qty;
    let realized = 0;

    if(t.side==='BUY' || t.side==='COVER'){      // 买入 / 回补 -> 先覆盖空头
       // 先匹配负值 lot
       for(let i=0; i<lots.length && remaining>0; ){
         const lot = lots[0];
         if(lot.qty < 0){
           const closeQty = Math.min(remaining, -lot.qty);
           realized += (lot.price - t.price) * closeQty;   // 空头盈利 = 建仓价 - 回补价
           lot.qty += closeQty;
           remaining -= closeQty;
           if(lot.qty === 0) lots.shift();
         }else break;
       }
       // 剩余部分开多仓
       if(remaining>0){
         lots.push({qty: remaining, price: t.price});
       }
    }else if(t.side==='SELL' || t.side==='SHORT'){   // 卖出 / 做空
       // 先匹配正值 lot
       for(let i=0; i<lots.length && remaining>0; ){
         const lot = lots[0];
         if(lot.qty > 0){
           const closeQty = Math.min(remaining, lot.qty);
           realized += (t.price - lot.price) * closeQty;   // 多头盈利 = 卖价 - 成本价
           lot.qty -= closeQty;
           remaining -= closeQty;
           if(lot.qty === 0) lots.shift();
         }else break;
       }
       // 剩余部分作为新空头仓位
       if(remaining>0){
         lots.push({qty: -remaining, price: t.price});
       }
    }

    // 写回盈亏与是否已平仓标识
    t.pl = realized;
    t.closed = realized !== 0;
  });

  /* 汇总成持仓数组 */
  positions = Object.entries(symbolLots).map(([sym, lots])=>{
      const qty = lots.reduce((s,l)=> s + l.qty, 0);
      const cost = lots.reduce((s,l)=> s + l.qty * l.price, 0);
      return {symbol: sym,
              qty: qty,
              avgPrice: qty ? Math.abs(cost) / Math.abs(qty) : 0,
              last: lots.length ? lots[lots.length-1].price : 0,
              priceOk: false};
  }).filter(p=> p.qty !== 0);
}


/* ---------- 4. Statistics ---------- */


/* ---------- Calc Intraday Realized P/L (v7.7.5) ---------- */
function calcIntraday(trades){
  const todayStr = new Date().toISOString().slice(0,10);
  const dayTrades = trades.filter(t=> t.date === todayStr);
  const bySymbol = {};
  dayTrades.forEach(t=>{
    if(!bySymbol[t.symbol]) bySymbol[t.symbol]=[];
    bySymbol[t.symbol].push(t);
  });
  let pl = 0;
  Object.entries(bySymbol).forEach(([sym, ts])=>{
    // Keep order as recorded
    const queue=[];
    ts.forEach(t=>{
      // Determine signed quantity
      let signedQty=0;
      if(t.side==='BUY'||t.side==='COVER'){ signedQty = t.qty; }
      else if(t.side==='SELL'||t.side==='SHORT'){ signedQty = -t.qty; }
      else { return; }
      let price = t.price;
      if(signedQty>0){
        // buy side: try to offset earlier shorts within day
        let remaining = signedQty;
        while(remaining>0 && queue.length && queue[0].qty<0){
          let opp = queue[0];
          const match = Math.min(remaining, -opp.qty);
          pl += (opp.price - price) * match; // short then cover
          opp.qty += match; // increase towards 0
          remaining -= match;
          if(opp.qty===0) queue.shift();
        }
        if(remaining>0){
          queue.push({qty: remaining, price});
        }
      }else if(signedQty<0){
        // sell side
        let remaining = -signedQty;
        while(remaining>0 && queue.length && queue[0].qty>0){
          let opp = queue[0];
          const match = Math.min(remaining, opp.qty);
          pl += (price - opp.price) * match; // buy then sell
          opp.qty -= match;
          remaining -= match;
          if(opp.qty===0) queue.shift();
        }
        if(remaining>0){
          queue.push({qty: -remaining, price});
        }
      }
    });
  });
  return pl;
}

/* ========== Enhanced Statistics Module v7.46 ========== */
function getTodayNY(){
  return luxon.DateTime.now().setZone('America/New_York').toFormat('yyyy-LL-dd');
}

/* Main statistics calc – returns an object with 13 fields */
function stats(){
  /* ---------- Pre‑flight: ensure positions & trades ---------- */
  if(!Array.isArray(window.positions)){
    if(typeof recalcPositions==='function') recalcPositions();
    if(!Array.isArray(window.positions)) window.positions = [];
  }
  const positions = window.positions;
  const tradesRaw = JSON.parse(localStorage.getItem('trades')||'[]');
  // normalise numeric
  const trades = tradesRaw.map(t=>({...t, qty:Number(t.qty), price:Number(t.price)}));

  const today = getTodayNY();

  /* 1‑3. Cost / Value / Floating P&L (all open) */
  const cost = positions.reduce((s,p)=> s + Math.abs(p.qty * p.avgPrice), 0);
  const value = positions.reduce((s,p)=> p.priceOk===false ? s : s + Math.abs(p.qty)*p.last, 0);
  const floating = positions.reduce((s,p)=>{
      if(p.qty===0 || p.priceOk===false) return s;
      const pl = p.qty>0
               ? (p.last - p.avgPrice) * p.qty
               : (p.avgPrice - p.last) * Math.abs(p.qty);
      return s + pl;
  },0);

  /* ---------- Helper: build pre‑today lots snapshot ---------- */
  const preLots = {};   // {symbol: [{qty, price}] } – qty sign long+: short- 
  trades
    .filter(t=> t.date < today)
    .sort((a,b)=> new Date(a.date) - new Date(b.date))
    .forEach(t=>{
      const sign = (t.side==='BUY'||t.side==='COVER'||t.side==='BOUGHT'||t.side==='买入') ? +1 : -1;
      const qty  = sign * t.qty;
      const lot  = {qty, price:t.price};
      preLots[t.symbol] = preLots[t.symbol] || [];
      if(qty>0){ // long buy
        preLots[t.symbol].push(lot);
      }else{     // sell / short
        let remaining = -qty;
        while(remaining>0 && preLots[t.symbol].length && preLots[t.symbol][0].qty>0){
          const opp = preLots[t.symbol][0];
          const c = Math.min(remaining, opp.qty);
          opp.qty -= c;
          if(opp.qty===0) preLots[t.symbol].shift();
          remaining -= c;
        }
        if(remaining>0){
          preLots[t.symbol].push({qty:-remaining, price:t.price});
        }
      }
    });

  /* ---------- Today’s realized P/L & intraday P/L ---------- */
  let totalRealizedToday = 0;   // module 4 + 5 combined
  let intraDayPL = 0;           // module 5
  let todayTradeCount = 0;

  // per‑symbol intraday queue
  const dayQueue = {};

  trades
    .filter(t=> t.date === today)
    .sort((a,b)=> new Date(a.time||a.date) - new Date(b.time||b.date))
    .forEach(t=>{
      const sign = (t.side==='BUY'||t.side==='COVER'||t.side==='BOUGHT'||t.side==='买入') ? +1 : -1;
      let qty = sign * t.qty;
      const price = t.price;
      todayTradeCount += 1;

      // 1) first try to offset historical lots
      const lots = preLots[t.symbol] || [];
      while(qty!==0 && lots.length && qty*lots[0].qty<0){
        const lot = lots[0];
        const match = Math.min(Math.abs(qty), Math.abs(lot.qty));
        const pl = lot.qty>0
                  ? (price - lot.price) * match    // closing long
                  : (lot.price - price) * match;   // closing short
        totalRealizedToday += pl;
        lot.qty += (lot.qty>0 ? -match : match);   // reduce towards 0
        if(Math.abs(lot.qty) < 1e-6) lots.shift();
        qty += (qty>0 ? -match : match);
      }

      // 2) then match within‑day queue
      dayQueue[t.symbol] = dayQueue[t.symbol] || [];
      const dq = dayQueue[t.symbol];
      while(qty!==0 && dq.length && qty*dq[0].qty<0){
        const lot = dq[0];
        const match = Math.min(Math.abs(qty), Math.abs(lot.qty));
        const pl = lot.qty>0
                  ? (price - lot.price) * match
                  : (lot.price - price) * match;
        intraDayPL += pl;
        totalRealizedToday += pl;
        lot.qty += (lot.qty>0 ? -match : match);
        if(Math.abs(lot.qty) < 1e-6) dq.shift();
        qty += (qty>0 ? -match : match);
      }

      // 3) whatever remains becomes an intraday open lot
      if(qty!==0){
        dq.push({qty, price});
      }
    });

  const todayReal = totalRealizedToday - intraDayPL;  // module 4

  /* 6. Daily unrealised P/L (based on prevClose vs last / avgPrice) */
  const dailyUnrealized = positions.reduce((s,p)=>{
      if(p.qty===0 || p.priceOk===false) return s;
      let base = typeof p.prevClose==='number' ? p.prevClose : p.avgPrice;
      const delta = p.qty>0
                  ? (p.last - base) * p.qty
                  : (base - p.last) * Math.abs(p.qty);
      return s + delta;
  },0);

  /* 8. cumulative trade count & 10. winRate */
  const allTradesCopy = trades.map(t=>({...t}));
  if(window.FIFO && typeof window.FIFO.computeFIFO==='function'){
    window.FIFO.computeFIFO(allTradesCopy);
  }
  const closedTrades = allTradesCopy.filter(t=>t.closed);
  const histReal = closedTrades.reduce((s,t)=> s + (t.pl||0), 0);
  const wins = closedTrades.filter(t=>(t.pl||0)>0).length;
  const winRate = closedTrades.length? (wins/closedTrades.length*100):0;

  /* 11‑13. WTD / MTD / YTD using equity curve + today delta */
  const curve = (typeof loadCurve==='function') ? loadCurve() : [];
  const todayDelta = dailyUnrealized + todayReal;
  const dtToday = luxon.DateTime.fromFormat(today,'yyyy-LL-dd');
  const weekStart = dtToday.startOf('week').minus({days: dtToday.weekday===7?6:0}).plus({days:1}); // Monday
  const monthStart = dtToday.startOf('month');
  const yearStart = dtToday.startOf('year');

  function sumSince(startDT){
    const startStr = startDT.toFormat('yyyy-LL-dd');
    return curve.filter(p=> p.date >= startStr).reduce((s,e)=> s + (e.delta||0), 0) + todayDelta;
  }
  const wtd = sumSince(weekStart);
  const mtd = sumSince(monthStart);
  const ytd = sumSince(yearStart);

  return {
    cost,value,floating,
    todayReal,intraDayPL,
    dailyUnrealized,
    todayTradeCount,
    totalTrades: trades.length,
    histReal,
    winRate,
    wtd,mtd,ytd
  };
}

/* ---------- Render stats boxes ---------- */
function renderStats(){
  const S = stats();   // compute
  const $ = (id)=> document.getElementById(id);

  if(!window.Utils){
    console.warn('Utils not loaded');
    return;
  }
  const F = window.Utils;  // helpers

  const mapping = [
    ['stat-1' ,'账户总成本',     F.fmtDollar(S.cost)],
    ['stat-2' ,'目前市值',       F.fmtDollar(S.value)],
    ['stat-3' ,'当前浮动盈亏',   F.fmtDollar(S.floating)],
    ['stat-4' ,'当日已实现盈亏', F.fmtDollar(S.todayReal)],
    ['stat-5' ,'日内交易',       F.fmtDollar(S.intraDayPL)],
    ['stat-6' ,'当日浮动盈亏',   F.fmtDollar(S.dailyUnrealized)],
    ['stat-7' ,'当日交易次数',   F.fmtInt(S.todayTradeCount)],
    ['stat-8' ,'累计交易次数',   F.fmtInt(S.totalTrades)],
    ['stat-9' ,'历史已实现盈亏', F.fmtDollar(S.histReal)],
    ['stat-10','胜率',          `<span class="white">${S.winRate.toFixed(1)}%</span>`],
    ['stat-11','WTD',           F.fmtDollar(S.wtd)],
    ['stat-12','MTD',           F.fmtDollar(S.mtd)],
    ['stat-13','YTD',           F.fmtDollar(S.ytd)],
  ];

  mapping.forEach(([id,label,val])=>{
    const el = $(id);
    if(!el) return;
    el.innerHTML = `<div class="label">${label}</div><div class="value">${val}</div>`;
  });
}
/* auto-render on load & whenever positions/trades refresh */
renderStats();



/* ---------- 7. Wire up ---------- */
window.addEventListener('load',()=>{
  // recalc positions in case only trades exist
  recalcPositions();
  renderStats();renderPositions();renderPositions();renderTrades();
  renderSymbolsList();
  updateClocks();
  setInterval(updateClocks,1000);

  document.getElementById('fab')?.addEventListener('click',addTrade);
  document.getElementById('export')?.addEventListener('click',exportData);
  if(location.hash==='#edit'){
    const idx=parseInt(localStorage.getItem('editIndex'),10);
    if(!isNaN(idx)){
      openTradeForm(idx);
      localStorage.removeItem('editIndex');
      history.replaceState(null,'',location.pathname);
    }
  }
  document.getElementById('import')?.addEventListener('click',importData);
});



/* ---------- 6. Real‑time price via Finnhub ---------- */


/* ---------- Price cell updater to avoid full re-render ---------- */
function updatePriceCells(){
  positions.forEach(p=>{
    const priceCell = document.getElementById(`rt-${p.symbol}`);
    if(priceCell) priceCell.textContent = (p.priceOk===false?'--':p.last.toFixed(2));

    const pl = (p.last - p.avgPrice) * p.qty;
    const cls = pl>0?'green':pl<0?'red':'white';
    const plCell = document.getElementById(`pl-${p.symbol}`);
    if(plCell){
      plCell.textContent = (p.priceOk===false?'--':pl.toFixed(2));
      plCell.className = cls;
    }
    const realized = trades.filter(t=>t.symbol===p.symbol && t.closed).reduce((s,t)=>s+t.pl,0);
    const totalPNL = pl + realized;
    const totalCell = document.getElementById(`total-${p.symbol}`);
    if(totalCell){
      totalCell.textContent = (p.priceOk===false?'--':totalPNL.toFixed(2));
      totalCell.className = totalPNL>0?'green':totalPNL<0?'red':'white';
    }
  });
}

function updatePrices(){
  // 尝试读取 KEY.txt 里的 Finnhub key；如果读取失败就回退到内置 key
  fetch('KEY.txt')
    .then(r=> r.ok ? r.text() : '')
    .catch(()=> '')        // in case of 404/网络错误
    .then(text=>{
       const m   = text.match(/Finnhub key：([\w]+)/);
       const apiKey = (m?m[1]:'d19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg').trim();
       if(!apiKey) return;

       // 为当前所有持仓并行请求价格，全部返回后再统一刷新界面
       const reqs = positions.map(p=>{
         return fetch(`https://finnhub.io/api/v1/quote?symbol=${p.symbol}&token=${apiKey}`)
                .then(r=>r.json())
                .then(q=>{
                   if(q && q.c){ p.last = q.c; if(p.prevClose == null) p.prevClose = q.pc; p.priceOk = true; } else { p.priceOk = false; }
                })
                .catch(()=>{/* 网络错误忽略 */});
       });

       Promise.all(reqs).then(()=>{
        updatePriceCells();
          renderStats();
       });
    });
}



/* ---------- Symbols List Renderer (功能区3) ---------- */
function renderSymbolsList(){
  const container = document.getElementById('symbols-list');
  if(!container) return;
  const symbols = [...new Set(trades.map(t=>t.symbol))].sort();
  container.innerHTML = '';
  symbols.forEach(sym=>{
    const a = document.createElement('a');
    a.href = 'stock.html?symbol=' + encodeURIComponent(sym);
    a.textContent = sym;
    a.className = 'symbol-tag';
    container.appendChild(a);
  });
}
/* re-render symbols list whenever trades change */
/* fetch prices on load */
attachPrevCloses().then(()=>{
    updatePrices();
    // 每分钟刷新一次价格
    setInterval(updatePrices, 60000);
  });

/* ---------- Equity Curve EOD capture ---------- */
function maybeCloseEquity(){
  const nowNY = luxon.DateTime.now().setZone('America/New_York'); // require luxon in page
  const tradeDate = nowNY.toFormat('yyyy-LL-dd');
  // only run if after 16:05 ET
  if(nowNY.hour > 16 || (nowNY.hour === 16 && nowNY.minute >= 5)){
    const curve = loadCurve();
    if(curve.at(-1)?.date === tradeDate) return; // already recorded
    const s = stats();
    const delta = s.dailyUnrealized + s.todayReal;
    const cumulative = (curve.at(-1)?.cumulative ?? 0) + delta;
    curve.push({date: tradeDate, delta, cumulative});
    saveCurve(curve);
  }
}
maybeCloseEquity();
setInterval(maybeCloseEquity, 60_000);

})();



// === helper to refresh all tables when SymbolCN or data updated ===
function refreshAll(){
  try{
    renderStats();
  }catch(e){}
  try{
    renderPositions();
  }catch(e){}
  try{
    renderTrades();
  }catch(e){}
}

/* ---- NY Date Display ---- */
function renderNYDate(){
  const opts = {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'};
  document.getElementById('nyDate').textContent = new Intl.DateTimeFormat('zh-CN',opts).format(new Date());
}
renderNYDate();
setInterval(renderNYDate,60*1000);
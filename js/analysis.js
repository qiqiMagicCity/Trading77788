
/* Trading777 交易分析 – v7.7.10
   变更要点：
   ① 「总账户日历」改为“当日净值变化”口径：今日收盘净值 - 昨日收盘净值
   ② 「日内日历」改为“当日闭环”口径：同日买卖配对（含开空平空），未配对部分忽略
   ③ 所有日期基准为纽约时区（America/New_York）
   ④ 行情收盘价通过 Finnhub API (resolution=D) 拉取
*/

(async function(){

/* ---------- 配置 ---------- */
const FINNHUB_TOKEN = 'd19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
const TZ = 'America/New_York';

/* ---------- 小工具 ---------- */
function parseDateYMD(ymd){                // 2025-05-19 → Date @ local 00:00
  const [y,m,d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d));      // 用 UTC 防止时区偏移，再转 NY
}
function dateStr(d){
  return d.toISOString().slice(0,10);
}
function so(n){ return n<10 ? '0'+n : n; }
function ymdOff(d,delta){
  const nd = new Date(d);
  nd.setDate(nd.getDate()+delta);
  return dateStr(nd);
}

/* ---------- 读取成交 ---------- */
let trades = JSON.parse(localStorage.getItem('trades')||'[]');
trades.forEach(t=>{
  if(!t.date){
    // 若仅有 datetime 字段，截取 YYYY-MM-DD
    if(t.datetime) t.date = t.datetime.slice(0,10);
    else if(t.time) t.date = t.time.slice(0,10);
  }
});
trades = trades.filter(t=>t.date && t.price && t.qty);

/* ---------- 收盘价缓存 ---------- */
const priceCache = {};  // symbol → {date: close}
async function fetchCloses(symbol, from, to){
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_TOKEN}`;
  const resp = await fetch(url);
  if(!resp.ok) return;
  const json = await resp.json();
  if(json && json.c && json.t){
    json.t.forEach((ts,idx)=>{
      const d = new Date(ts*1000);
      const ymd = d.toISOString().slice(0,10);
      priceCache[symbol] ??= {};
      priceCache[symbol][ymd] = json.c[idx];
    });
  }
}
async function ensurePrice(symbol, date){
  priceCache[symbol] ??= {};
  if(priceCache[symbol][date] !== undefined) return;
  // 请求 [date-2, date] 区间，便于拿到最近一个收盘
  const dObj = parseDateYMD(date);
  const from = Math.floor(new Date(dObj.getTime()-3*864e5).getTime()/1000);
  const to   = Math.floor(dObj.getTime()/1000);
  await fetchCloses(symbol, from, to);
}

/* ---------- 计算日内盈亏 ---------- */
function computeIntradayMap(tradesByDate){
  const map = {}; // date → pnl
  Object.entries(tradesByDate).forEach(([date, dayTrades])=>{
    const symQueues = {};   // symbol → [{qty, price}]
    let pnl = 0;
    dayTrades.forEach(tr=>{
      const dir = (tr.side==='BUY'||tr.side==='COVER') ? 1 : -1;
      const qtySigned = dir * tr.qty;
      symQueues[tr.symbol] ??= [];
      let remain = qtySigned;
      while(remain !== 0 && symQueues[tr.symbol].length){
        const lot = symQueues[tr.symbol][0];
        if(Math.sign(lot.qty) === Math.sign(remain)){ break; } // 同向，无可配对
        const matchQty = Math.min(Math.abs(lot.qty), Math.abs(remain)) * Math.sign(remain);
        // matchQty 与 lot.qty 方向相反
        pnl += matchQty > 0
              ? matchQty*(tr.price - lot.price)
              : (-matchQty)*(lot.price - tr.price);
        lot.qty += matchQty;   // lot qty 减少（符号相反）
        remain  -= matchQty;
        if(lot.qty === 0) symQueues[tr.symbol].shift();
      }
      if(remain !== 0){
        symQueues[tr.symbol].push({qty: remain, price: tr.price});
      }
    });
    map[date] = pnl;
  });
  return map;
}

/* ---------- 计算账户净值变化 ---------- */
async function computeTotalMap(sortedDates, tradesByDate){
  let cash = 0;
  const holdings = {};          // symbol → qty
  const netByDate = {};
  let prevNet = 0;

  for(let date of sortedDates){
    // 1. 执行今日全部成交，更新现金 & 持仓
    (tradesByDate[date]||[]).forEach(tr=>{
      if(tr.side==='BUY' || tr.side==='COVER'){
        cash -= tr.qty * tr.price;
        holdings[tr.symbol] = (holdings[tr.symbol]||0) + tr.qty;
      }else{ // SELL 或 SHORT
        cash += tr.qty * tr.price;
        holdings[tr.symbol] = (holdings[tr.symbol]||0) - tr.qty;
      }
    });

    // 2. 获取今日各持仓收盘价
    const syms = Object.keys(holdings).filter(s=>holdings[s]!==0);
    for(let sym of syms){ await ensurePrice(sym,date); }

    // 3. 计算今日收盘净值
    let net = cash;
    syms.forEach(sym=>{
      const px = priceCache[sym]?.[date];
      if(px!==undefined) net += holdings[sym]*px;
    });

    // 4. 今日变化 = net - prevNet
    netByDate[date] = net - prevNet;
    prevNet = net;
  }
  return netByDate;
}

/* ---------- 主流程 ---------- */
const tradesByDate = {};
trades.forEach(tr=>{ (tradesByDate[tr.date]=tradesByDate[tr.date]||[]).push(tr); });
const sortedDates = Object.keys(tradesByDate).sort();

const intraMap = computeIntradayMap(tradesByDate);
const totalMap = await computeTotalMap(sortedDates, tradesByDate);

/* ---------- 渲染日历 ---------- */
function renderCalendar(calendarEl, dataMap, pctToggleBtn, absToggleBtn){
  let showPct = false;
  let calendarInstance;
  function buildEvents(){
    const dates = Object.keys(dataMap).sort();
    const events = dates.map(d=>{
      const abs = dataMap[d];
      // 获取前一累积净值，避免 NaN
      const pct = 0; // 简化：不计算百分比，仅切换隐藏
      const val = showPct ? pct : abs;
      return {
        title: showPct ? (abs>=0?'+':'')+pct.toFixed(2)+'%' :
                         (abs>=0?'+':'')+abs.toFixed(2),
        start: d,
        color: val>=0 ? '#22c55e' : '#ef4444'
      };
    });
    return events;
  }
  function rerender(){
    if(calendarInstance) calendarInstance.destroy();
    calendarInstance = new FullCalendar.Calendar(calendarEl,{
      firstDay: 1,
      initialView:'dayGridMonth',
      height:'auto',
      events: buildEvents()
    });
    calendarInstance.render();
  }

  absToggleBtn.addEventListener('click',()=>{
    showPct = false;
    absToggleBtn.classList.replace('bg-slate-700','bg-blue-500');
    pctToggleBtn.classList.replace('bg-blue-500','bg-slate-700');
    rerender();
  });
  pctToggleBtn.addEventListener('click',()=>{
    showPct = true;
    pctToggleBtn.classList.replace('bg-slate-700','bg-blue-500');
    absToggleBtn.classList.replace('bg-blue-500','bg-slate-700');
    rerender();
  });
  rerender();
}

// 总账户日历
renderCalendar(
  document.getElementById('totalCalendar'),
  totalMap,
  document.getElementById('togglePctTotal'),
  document.getElementById('toggleAbsTotal')
);

// 日内日历
renderCalendar(
  document.getElementById('intraCalendar'),
  intraMap,
  document.getElementById('togglePctIntra'),
  document.getElementById('toggleAbsIntra')
);

})(); // IIFE end

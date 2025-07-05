
/* Trading777 交易分析 – v7.7.13
 * 日历算法重写：满足「总账户＝每日净值变动」「日内＝当天闭环」原则
 * 时间基准：America/New_York
 * Finnhub 日K收盘价抓取并本地缓存 localStorage('priceCache')
 */
(function(){
  const TZ = 'America/New_York';
  const API_BASE = 'https://finnhub.io/api/v1/stock/candle';
  const API_KEY  = (window.KEY || '').trim();   // KEY.txt 在 index.html 注入到全局
  const priceCache = JSON.parse(localStorage.getItem('priceCache')||'{}');  // {symbol:{date:close}}
  async function fetchDailyCloses(symbol, fromDate, toDate){
    // fromDate/toDate: 'YYYY-MM-DD'
    const fromUnix = Date.parse(fromDate+'T00:00:00-05:00')/1000;
    const toUnix   = Date.parse(toDate+'T23:59:59-05:00')/1000;
    const url = `${API_BASE}?symbol=${symbol}&resolution=D&from=${Math.floor(fromUnix)}&to=${Math.floor(toUnix)}&token=${API_KEY}`;
    const resp = await fetch(url); const data = await resp.json();
    if(data.s!=='ok') return {};
    const out={};
    data.t.forEach((ts,i)=>{
       const d = new Date(ts*1000).toLocaleDateString('sv-SE',{timeZone:TZ});
       out[d]= data.c[i];
    });
    // merge into cache
    priceCache[symbol] = {...priceCache[symbol], ...out};
    localStorage.setItem('priceCache', JSON.stringify(priceCache));
    return out;
  }

  /* ---------- helpers ---------- */
  function ymd(dateObj){
    return dateObj.toLocaleDateString('sv-SE',{timeZone:TZ}); // YYYY-MM-DD
  }
  function dateFromYMD(s){
    const [y,m,d] = s.split('-').map(Number);
    return new Date(Date.UTC(y,m-1,d,5,0,0)); // create roughly NY midnight
  }
  function sign(v){ return v>0?'green': v<0?'red':'grey'; }

  /* ---------- load trades ---------- */
  const trades = JSON.parse(localStorage.getItem('trades')||'[]');  // assume存在
  trades.sort((a,b)=> new Date(a.date)-new Date(b.date));

  /* ---------- build Total Account calendar ---------- */
  async function buildTotalCalendar(){
    if(!trades.length) return {};
    const firstDay = ymd(new Date(trades[0].date));
    const lastDay  = ymd(new Date(trades[trades.length-1].date));
    // Gather symbols
    const symbols = [...new Set(trades.map(t=>t.symbol))];
    // Fetch missing closes
    const promises=[];
    symbols.forEach(sym=>{
      const cacheDates = priceCache[sym]? Object.keys(priceCache[sym]):[];
      if(!cacheDates.includes(lastDay)){
         promises.push(fetchDailyCloses(sym, firstDay, lastDay));
      }
    });
    await Promise.all(promises);

    // Walk day-by-day
    const cashByDay = {};         // yyyy-mm-dd -> cash
    const posBySymbol = {};       // symbol -> qty (can be neg)
    let cash = 0;
    let prevValue = 0;
    const calendar={};

    let currentIdx=0;
    let dateIter = dateFromYMD(firstDay);
    const endDate = dateFromYMD(lastDay);
    while(dateIter<=endDate){
       const day = ymd(dateIter);
       // process trades on this day
       while(currentIdx<trades.length && ymd(new Date(trades[currentIdx].date))===day){
           const t = trades[currentIdx];
           const qty = Number(t.qty);
           const price = Number(t.price);
           if(['BUY','COVER','买入','回补','COVERED'].includes(t.side.toUpperCase())){
              cash -= price*qty;
              posBySymbol[t.symbol] = (posBySymbol[t.symbol]||0)+ qty;
           }else{
              // SELL or SHORT
              cash += price*qty;
              posBySymbol[t.symbol] = (posBySymbol[t.symbol]||0)- qty;
           }
           currentIdx++;
       }
       // compute value
       let value = cash;
       for(const [sym, qty] of Object.entries(posBySymbol)){
          if(Math.abs(qty)<1e-6) continue;
          const price = (priceCache[sym]&&priceCache[sym][day])?priceCache[sym][day]:null;
          if(price==null){
             // fallback: skip symbol until price available
             continue;
          }
          value += qty*price;
       }
       const delta = value - prevValue;
       calendar[day]= delta;
       prevValue = value;
       // next day
       dateIter.setUTCDate(dateIter.getUTCDate()+1);
    }
    return calendar;
  }

  
/* ---------- build Intraday calendar (v7.7.13 rewrite) ---------- */
function buildIntradayCalendar(){
  // Trades must be sorted ascending by datetime
  const calendar = {};
  const positions = {};   // carry‑over position before current trade, per symbol
  let currentDay = null;
  let baseline = {};
  let queues = {};
  let pnlDay = 0;
  function flushDay(){ if(currentDay!==null) calendar[currentDay]=Number(pnlDay.toFixed(2)); }
  trades.forEach(t=>{
    const tradeDay = ymd(new Date(t.date));
    if(tradeDay!==currentDay){
       // new day – store result of previous day, reset state
       flushDay();
       currentDay = tradeDay;
       baseline = {...positions};   // snapshot of positions at start of day
       queues = {};                 // per symbol {long:[], short:[]}
       pnlDay = 0;
    }
    const sideStr = (t.side||'').toUpperCase();
    const isBuy = ['BUY','COVER','买入','回补'].some(s=>sideStr.includes(s));
    const qty = Math.abs(Number(t.qty));
    const price = Number(t.price);
    const sym = t.symbol;
    if(!queues[sym]) queues[sym] = {long:[], short:[]};
    if(!(sym in baseline)) baseline[sym]=0;
    if(!(sym in positions)) positions[sym]=baseline[sym];
    const q = queues[sym];
    let qtyRem = qty;
    if(isBuy){
        // 1. Match against intraday short queue
        while(qtyRem>0 && q.short.length){
           const lot = q.short[0];
           const use = Math.min(qtyRem, lot.qty);
           pnlDay += (lot.price - price)*use;
           lot.qty -= use; qtyRem -= use;
           if(lot.qty===0) q.short.shift();
        }
        // 2. Cover baseline short if any remaining
        if(baseline[sym]<0){
           const baselineShortRem = Math.max(0, -Math.min(positions[sym], baseline[sym]));
           const cover = Math.min(qtyRem, baselineShortRem);
           positions[sym] += cover; qtyRem -= cover;
        }
        // 3. Any remainder forms intraday long
        if(qtyRem>0){
           q.long.push({qty:qtyRem,price});
           positions[sym] += qtyRem;
        }
    }else{ // SELL / SHORT
        // 1. Match against intraday long queue
        while(qtyRem>0 && q.long.length){
           const lot = q.long[0];
           const use = Math.min(qtyRem, lot.qty);
           pnlDay += (price - lot.price)*use;
           lot.qty -= use; qtyRem -= use;
           if(lot.qty===0) q.long.shift();
        }
        // 2. Reduce baseline long if any remaining
        if(baseline[sym]>0){
           const baselineLongRem = Math.max(0, Math.min(positions[sym], baseline[sym]));
           const reduce = Math.min(qtyRem, baselineLongRem);
           positions[sym] -= reduce; qtyRem -= reduce;
        }
        // 3. Any remainder forms intraday short
        if(qtyRem>0){
           q.short.push({qty:qtyRem,price});
           positions[sym] -= qtyRem;
        }
    }
  });
  flushDay();
  return calendar;
}


  /* ---------- render ---------- */
  async function main(){
     const [tot, intra] = await Promise.all([buildTotalCalendar(), Promise.resolve(buildIntradayCalendar())]);
     // simple console output; integrate into UI later
     console.table(tot);
     console.table(intra);
     window.Calendars = {total:tot, intraday:intra};
  }
  main();
})();

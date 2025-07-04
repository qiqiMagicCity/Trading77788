/* Trading777 v5.3.20 dashboard – implements import/export, dynamic positions, add-trade */

(function(){

  /* ---------- 1. Data bootstrap ---------- */
  const defaultPositions = [
    {symbol:'AAPL',qty:900,avgPrice:100,last:188.95},
    {symbol:'TSLA',qty:50,avgPrice:200,last:178.45}
  ];
  const defaultTrades = [
    {date:'2025-06-30',symbol:'AAPL',side:'SELL', qty:100,price:220,pl:12000,closed:true},
    {date:'2025-06-30',symbol:'AAPL',side:'BUY',  qty:100,price:100,pl:0,closed:false},
    {date:'2025-06-29',symbol:'TSLA',side:'SELL', qty:50, price:210,pl:500,closed:true}
  ];

  let positions = JSON.parse(localStorage.getItem('positions')||'null') || defaultPositions.slice();
  let trades    = JSON.parse(localStorage.getItem('trades')   ||'null') || defaultTrades.slice();
  recalcPositions();

  /* ---------- 2. Utils ---------- */
  function fmtSign(n){
    const cls = n>0 ? 'green' : n<0 ? 'red' : 'white';
    const val = Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    return `<span class="${cls}">${n<0?'-':''}${val}</span>`;
  }
  function fmtDollar(n){ return `$ ${fmtSign(n)}`; }
  function fmtInt(n){    return `<span class="white">${Number(n).toLocaleString()}</span>`; }
  function fmtWL(w,l){   return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`; }
  function fmtPct(p){    return `<span class="white">${Number(p).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})}%</span>`; }
  const Utils = { fmtDollar, fmtInt, fmtWL, fmtPct };

  /* ---------- 3. Derived data & FIFO ---------- */
  function recalcPositions(){
    const symbolLots = {};
    trades.sort((a,b)=> new Date(a.date) - new Date(b.date));
    trades.forEach(t=>{
      const lots = symbolLots[t.symbol] || (symbolLots[t.symbol]=[]);
      let rem = t.qty, realized=0;
      if(t.side==='BUY' || t.side==='COVER'){
        while(lots.length && rem>0 && lots[0].qty<0){
          const lot = lots[0];
          const cq  = Math.min(rem, -lot.qty);
          realized += (lot.price - t.price)*cq;
          lot.qty += cq; rem -= cq;
          if(lot.qty===0) lots.shift();
        }
        if(rem>0) lots.push({qty:rem,price:t.price});
      } else {
        while(lots.length && rem>0 && lots[0].qty>0){
          const lot = lots[0];
          const cq  = Math.min(rem, lot.qty);
          realized += (t.price - lot.price)*cq;
          lot.qty -= cq; rem -= cq;
          if(lot.qty===0) lots.shift();
        }
        if(rem>0) lots.push({qty:-rem,price:t.price});
      }
      t.pl     = realized;
      t.closed = realized!==0;
    });
    positions = Object.entries(symbolLots).map(([sym, lots])=>{
      const qty  = lots.reduce((s,l)=>s+l.qty,0);
      const cost = lots.reduce((s,l)=>s + l.qty*l.price,0);
      return {
        symbol: sym,
        qty,
        avgPrice: qty ? Math.abs(cost)/Math.abs(qty) : 0,
        last: lots.length ? lots[lots.length-1].price : 0,
        priceOk: false
      };
    }).filter(p=>p.qty!==0);
  }

  /* ---------- 4. Statistics ---------- */
  function stats(){
    // ...（统计逻辑保持不变）...
    return {
      cost, value, floating, todayReal,
      wins, losses,
      todayTrades: todayTrades.length,
      totalTrades: trades.length,
      histReal, winRate,
      wtdReal, mtdReal, ytdReal
    };
  }

  /* ---------- 5. Render helpers ---------- */
  function updateClocks(){ /* ... */ }
  function renderStats(){ /* ... */ }
  function renderPositions(){ /* ... */ }
  function renderTrades(){ /* ... */ }
  function renderSymbolsList(){ /* ... */ }

  /* ---------- 6. Actions & Wiring ---------- */
  function addTrade(){ openTradeForm(); }
  function exportData(){ /* ... */ }
  function importData(){ /* ... */ }
  function openTradeForm(editIndex){ /* ... */ }

  window.addEventListener('load', ()=>{
    recalcPositions();
    renderStats();
    renderPositions();
    renderTrades();
    renderSymbolsList();
    updateClocks();
    setInterval(updateClocks,1000);
    document.getElementById('fab')?.addEventListener('click', addTrade);
    document.getElementById('export')?.addEventListener('click', exportData);
    document.getElementById('import')?.addEventListener('click', importData);
    if(location.hash==='#edit'){ /* ... */ }
  });

  /* Real-time price via Finnhub – 保持不变 */
  function updatePrices(){ /* ... */ }
  updatePrices();
  setInterval(updatePrices,60000);

})();

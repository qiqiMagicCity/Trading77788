// ---- Helper: getWeekIdx returns 0 (Sun) - 6 (Sat) using UTC to avoid timezone skew ----
function getWeekIdx(dateStr){
  const parts = dateStr.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1]-1, parts[2])).getUTCDay();
}

/* FIFO cost calculation & metrics – ported from Apps Script (迭代3.3.2) */
(function(g){
  function computeFIFO(allTrades){
    const EPS = 1e-6;
    const symMap = {};   // per‑symbol state
    // sort in-place by date asc (YYYY-MM-DD) then original order
    allTrades.sort((a,b)=>{
      const d1 = new Date(a.date), d2 = new Date(b.date);
      return d1 - d2;
    });

    allTrades.forEach(t=>{
      // ensure numeric types
      t.price = Number(t.price);
      t.qty   = Number(t.qty);

      const s = t.symbol || 'UNKNOWN';
      const st = symMap[s] || (symMap[s] = {
        positionList: [],
        direction: 'NONE',
        accRealized: 0,
        count: 0
      });
      st.count += 1;

      let showPNL = 0;
      
      const price = t.price;
      const qty   = t.qty * (t.type==='Option'?100:1); // --- Option qty factor


      if(t.side==='BUY' || t.side==='COVER' || t.side==='回补' || t.side==='BOUGHT' || t.side==='买入'){
        if(st.direction==='NONE' || st.direction==='LONG'){
          st.positionList.push({price, qty});
          st.direction='LONG';
        }else{
          let rem = qty;
          while(rem>EPS && st.positionList.length){
            const lot = st.positionList[0];
            const c = Math.min(rem, lot.qty);
            showPNL += (lot.price - price)*c;
            lot.qty -= c;
            rem -= c;
            if(lot.qty<=EPS) st.positionList.shift();
          }
          st.accRealized += showPNL;
          if(rem>EPS){
            st.positionList=[{price, qty: rem}];
            st.direction='LONG';
          }else if(!st.positionList.length){
            st.direction='NONE';
          }
        }
      }else if(t.side==='SELL' || t.side==='SHORT' || t.side==='做空' || t.side==='SOLD' || t.side==='卖出'){
        if(st.direction==='NONE' || st.direction==='SHORT'){
          st.positionList.push({price, qty});
          st.direction='SHORT';
        }else{
          let rem = qty;
          while(rem>EPS && st.positionList.length){
            const lot = st.positionList[0];
            const c = Math.min(rem, lot.qty);
            showPNL += (price - lot.price)*c;
            lot.qty -= c;
            rem -= c;
            if(lot.qty<=EPS) st.positionList.shift();
          }
          st.accRealized += showPNL;
          if(rem>EPS){
            st.positionList=[{price, qty: rem}];
            st.direction='SHORT';
          }else if(!st.positionList.length){
            st.direction='NONE';
          }
        }
      }

      const totalQty = st.positionList.reduce((s,l)=> s + l.qty, 0);
      const netAfter = (st.direction==='SHORT'? -totalQty : totalQty);

      let mVal = 0, jVal = 0;
      if(totalQty>EPS){
        const sumCost = st.positionList.reduce((s,l)=> s + l.price*l.qty, 0);
        mVal = sumCost / totalQty;
        jVal = (sumCost - st.accRealized) / totalQty;
      }

      // enrich trade object
      t.weekday = (function(d){ const w=d.getDay(); return ((w+6)%7)+1; })(new Date(t.date));
      t.count   = st.count;
      t.amount  = t.qty * t.price;
      t.be      = jVal;
      t.pl      = showPNL;          /* overwrite / set */
      t.afterQty= netAfter;
      t.avgCost = mVal;
    });

    return allTrades;
  }

  /* ---------- Compute Intraday PNL for M5 ---------- */
  function computeIntradayPNL(trades){
    const todayStr = todayNY();
    const dayTrades = trades.filter(t=> t.date === todayStr);
    const bySymbol = {};
    dayTrades.forEach(t=>{
      if(!bySymbol[t.symbol]) bySymbol[t.symbol]=[];
      bySymbol[t.symbol].push(t);
    });
    let behavior = 0;
    let fifo = 0;
    Object.entries(bySymbol).forEach(([sym, ts])=>{
      // Behavior perspective (M5.1)
      const queueBehavior = [];
      // FIFO perspective (M5.2) - use global FIFO from computeFIFO
      const fullTrades = FIFO.computeFIFO(trades.filter(tr => tr.symbol === sym));
      const dayFull = fullTrades.filter(tr => tr.date === todayStr);
      ts.forEach(t=>{
        let signedQty=0;
        if(t.side==='BUY'||t.side==='COVER'){ signedQty = t.qty; }
        else if(t.side==='SELL'||t.side==='SHORT'){ signedQty = -t.qty; }
        else { return; }
        let price = t.price;
        if(signedQty>0){
          let remaining = signedQty;
          while(remaining>0 && queueBehavior.length && queueBehavior[0].qty<0){
            let opp = queueBehavior[0];
            const match = Math.min(remaining, -opp.qty);
            behavior += (opp.price - price) * match;
            opp.qty += match;
            remaining -= match;
            if(opp.qty===0) queueBehavior.shift();
          }
          if(remaining>0){
            queueBehavior.push({qty: remaining, price});
          }
        }else if(signedQty<0){
          let remaining = -signedQty;
          while(remaining>0 && queueBehavior.length && queueBehavior[0].qty>0){
            let opp = queueBehavior[0];
            const match = Math.min(remaining, opp.qty);
            behavior += (price - opp.price) * match;
            opp.qty -= match;
            remaining -= match;
            if(opp.qty===0) queueBehavior.shift();
          }
          if(remaining>0){
            queueBehavior.push({qty: -remaining, price});
          }
        }
      });
      // FIFO (M5.2)
      fifo += dayFull.reduce((s, tr) => s + (tr.pl || 0), 0);
    });
    return {behavior: isFinite(behavior) ? behavior : 0, fifo: isFinite(fifo) ? fifo : 0};
  }

  g.FIFO = {computeFIFO, computeIntradayPNL};
})(window);
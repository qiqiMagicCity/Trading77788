
/* Trading777 – Analysis Engine  v7.7.17
 *
 * - Intraday calendar strictly follows user‑defined rule:
 *     Only trades that BOTH open and close within the same day, **and**
 *     whose opening leg also occurred on the same day, count.
 *     Any trade that merely reduces a carry‑in position is ignored.
 *
 * - Total calendar logic unchanged (FIFO realised + MTM float).
 *
 * - Data source: A SINGLE records file /data/records.json with schema:
 *     { trades:[...], prices:{sym:{YYYY-MM-DD:close}}, dailyPnL:{...}, metadata:{...} }
 *     For backward compat we still support /data/trades.json and /data/prices.json .
 *
 * - Price lookup now goes through priceStore (js/price-store.js):
 *     º local cache in localStorage
 *     º on cache miss → Finnhub API → persist
 *
 * After computation:
 *     window.Calendars = { intraday:{day: pnl}, total:{day:pnl} }
 *   and a "CalendarsReady" event is fired for UI layer.
 */
(function(){
  /* ---------- helpers ---------- */
  const num = v=> Number(v||0);
  const abs = Math.abs;
  const ymd = d => d.toISOString().slice(0,10);   // YYYY-MM-DD
  const isBuy = s=> /BUY|COVER|买|回补/i.test(s);
  const isSell= s=> !isBuy(s);

  /* ---------- load data ---------- */
  async function loadRecords(){
      // try unified file first
      let rec=null;
      try{
         const r = await fetch('/data/records.json');
         if(r.ok) rec = await r.json();
      }catch(_){}
      if(rec){
         return { trades:rec.trades||[], prices:rec.prices||{} };
      }
      // fallback
      const [trades, prices] = await Promise.all([
         fetch('/data/trades.json').then(r=>r.ok?r.json():[]).catch(_=>[]),
         fetch('/data/prices.json').then(r=>r.ok?r.json():{}).catch(_=>({}))
      ]);

// fallback to localStorage when no static files present
if(trades.length===0){
   try{
       const lsTrades = JSON.parse(localStorage.getItem('trades')||'[]');
       trades = lsTrades;
   }catch(e){}
}
if(Object.keys(prices).length===0){
   try{
       const lsPrices = JSON.parse(localStorage.getItem('prices')||'{}');
       prices = lsPrices;
   }catch(e){}
}
      return { trades, prices };
  }

  /* ---------- ensure prices ---------- */
  async function ensurePrices(trades){
      const syms = [...new Set(trades.map(t=>t.symbol))];
      const days = [...new Set(trades.map(t=> ymd(new Date(t.date))))];
      for(const sym of syms){
          for(const d of days){
              if(priceStore.cache?.[sym]?.[d]==null){
                 await priceStore.getClose(sym,d);
              }
          }
      }
      return priceStore.cache;
  }

  /* ---------- Intraday Calendar ---------- */
  function buildIntradayCalendar(tradesSorted){
      const cal = {};
      const posCarry = {};   // symbol -> qty carried into current day (long +, short -)

      let currentDay=null, dayTrades=[];
      const flushDay = ()=>{
         if(!currentDay) return;
         const pnl = calcDay(dayTrades, posCarry);
         cal[currentDay]=Number(pnl.toFixed(2));
         // update carry with end‑of‑day position
         dayTrades.forEach(tr=>{
            const q = num(tr.qty)*(isBuy(tr.side)?1:-1);
            posCarry[tr.symbol]=(posCarry[tr.symbol]||0)+q;
         });
         // reset
         dayTrades=[];
      };

      const calcDay = (list, carry)=>{        // list already time‑sorted
         const bySym = {};
         list.forEach(t=>{ (bySym[t.symbol]??=[]).push(t); });
         let pnlDay=0;

         Object.entries(bySym).forEach(([sym, arr])=>{
            let startPos = carry[sym]||0;
            // queues for positions opened TODAY
            const longLots=[], shortLots=[];
            arr.forEach(tr=>{
               let qty = num(tr.qty);
               const price = num(tr.price);
               const buy = isBuy(tr.side);
               let sign = buy?1:-1;

               // Step 1: consume against startPos (historical)
               if(startPos!==0 && sign==-Math.sign(startPos)){
                   const offset = Math.min(abs(startPos), qty);
                   // Not intraday, just offset historical pos
                   startPos += sign*offset;   // reduces magnitude towards 0
                   qty -= offset;
                   if(qty===0) return;        // trade fully consumed in historical adj
                   // leftover qty becomes new position within today
               }

               // Step 2: intraday matching against today's opposite lots
               if(buy){
                   // cover shorts opened TODAY first
                   while(qty>0 && shortLots.length){
                       const lot = shortLots[0];
                       const use = Math.min(qty, lot.qty);
                       pnlDay += (lot.price - price)*use;  // short profit = openPrice - closePrice
                       lot.qty -= use; qty -= use;
                       if(lot.qty===0) shortLots.shift();
                   }
                   if(qty>0) longLots.push({qty,price});   // open new long TODAY
               }else{ // sell
                   while(qty>0 && longLots.length){
                       const lot = longLots[0];
                       const use = Math.min(qty, lot.qty);
                       pnlDay += (price - lot.price)*use;   // long profit = sellPrice - buyPrice
                       lot.qty -= use; qty -= use;
                       if(lot.qty===0) longLots.shift();
                   }
                   if(qty>0) shortLots.push({qty,price}); // open new short TODAY
               }
            });
            // any remaining longLots/shortLots will roll into next day's carry
         });

         return pnlDay;
      };

      tradesSorted.forEach(tr=>{
         const d = ymd(new Date(tr.date));
         if(d!==currentDay){ flushDay(); currentDay=d; }
         dayTrades.push(tr);
      });
      flushDay();   // last day
      return cal;
  }

  /* ---------- Total Calendar (unchanged) ---------- */
  function buildTotalCalendar(trades, prices){
     const cal = {};
     if(!trades.length) return cal;
     const byDay={};
     trades.forEach(t=>{
        const d = ymd(new Date(t.date));
        (byDay[d]??=[]).push(t);
     });
     const days = Object.keys(byDay).sort();
     const longLots={}, shortLots={};
     let prevEquity=0;

     days.forEach(day=>{
        const list = byDay[day].sort((a,b)=> new Date(a.date)-new Date(b.date));
        let realised=0;
        list.forEach(tr=>{
           const sym=tr.symbol;
           const price=num(tr.price);
           const buy=isBuy(tr.side);
           const qtyInit=abs(num(tr.qty));
           longLots[sym]??=[]; shortLots[sym]??=[];
           let qty=qtyInit;

           if(buy){
              // close shorts first
              while(qty>0 && shortLots[sym].length){
                 const lot=shortLots[sym][0];
                 const use=Math.min(qty, lot.qty);
                 realised += (lot.price - price)*use;
                 lot.qty -= use; qty-=use;
                 if(lot.qty===0) shortLots[sym].shift();
              }
              if(qty>0) longLots[sym].push({qty,price});
           }else{
              // close longs first
              while(qty>0 && longLots[sym].length){
                 const lot=longLots[sym][0];
                 const use=Math.min(qty, lot.qty);
                 realised += (price - lot.price)*use;
                 lot.qty -= use; qty-=use;
                 if(lot.qty===0) longLots[sym].shift();
              }
              if(qty>0) shortLots[sym].push({qty,price});
           }
        });

        // mark‑to‑market
        let equity=0;
        const syms= new Set([...Object.keys(longLots), ...Object.keys(shortLots)]);
        syms.forEach(sym=>{
           const longQty=longLots[sym].reduce((s,l)=>s+l.qty,0);
           const shortQty=shortLots[sym].reduce((s,l)=>s+l.qty,0);
           if(longQty===0 && shortQty===0) return;
           const px = prices?.[sym]?.[day] ?? priceStore.cache?.[sym]?.[day];
           if(px==null) return;
           equity += longQty*px - shortQty*px;
        });

        const floatChange = equity - prevEquity;
        cal[day]=Number((realised+floatChange).toFixed(2));
        prevEquity = equity;
     });
     return cal;
  }

  /* ---------- main ---------- */
  (async function(){
     const {trades, prices:pricesFromFile} = await loadRecords();
     if(!trades || !trades.length){ console.error('No trades data'); return; }

     // ensure price cache
     const pricesCache = await ensurePrices(trades);
     // merge file prices into cache
     Object.entries(pricesFromFile).forEach(([sym,obj])=>{
        pricesCache[sym] = {...(pricesCache[sym]||{}), ...obj};
     });

     const tradesSorted=[...trades].sort((a,b)=> new Date(a.date)-new Date(b.date));
     const intraday = buildIntradayCalendar(tradesSorted);
     const total    = buildTotalCalendar(tradesSorted, pricesCache);

     
     // ---------- Persist calendars ----------
     const calCache = (function(){try{return JSON.parse(localStorage.getItem('calendars')||'{}');}catch(e){return {};}})();
     const updated = { ...calCache, intraday: {...calCache.intraday, ...intraday}, total:{...calCache.total,...total}};
     localStorage.setItem('calendars', JSON.stringify(updated));

     window.Calendars = {intraday,total};
     window.dispatchEvent(new Event('CalendarsReady'));
  })();
})();
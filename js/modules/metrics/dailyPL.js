// Auto-generated Trading77788 v3
// File: js/modules/metrics/dailyPL.js
// Date: 2025-07-12

import { buildFifoState, processTradeFIFO } from '../helpers/fifo.js';
// Compute total (M4 + M3) for each date in [start, end] inclusive, sum.
export default function dailyPL(trades=[], closeMap={}, startDateStr, endDateStr){
  const dates = Object.keys(closeMap).filter(d => d >= startDateStr && d <= endDateStr).sort();
  let sum = 0;
  // Pre-sort trades
  const sortedTrades = trades.slice().sort((a,b)=> a.date.localeCompare(b.date));
  for (const current of dates){
    // filter trades up to current date
    const dayTrades = sortedTrades.filter(t=> t.date===current);
    // Realized for day
    const stateBefore = buildFifoState();
    for (const t of sortedTrades.filter(t=> t.date < current)) processTradeFIFO(stateBefore,t);
    let realized=0;
    const cb = m=>{
      realized += m.direction==='long' ? (m.closePrice - m.openPrice)*m.qty : (m.openPrice - m.closePrice)*m.qty;
    };
    const tmpState = JSON.parse(JSON.stringify(stateBefore));
    for (const t of dayTrades){
      processTradeFIFO(tmpState,t,cb);
    }
    // Positions at end of day
    for (const t of dayTrades){
      processTradeFIFO(stateBefore,t); // update main state
    }
    let unreal=0;
    for (const sym in stateBefore){
      const close = closeMap[current]?.[sym];
      if (close===undefined) continue;
      for (const lot of stateBefore[sym].long){
        unreal += (close - lot.price)*lot.qty;
      }
      for (const lot of stateBefore[sym].short){
        unreal += (lot.price - close)*lot.qty;
      }
    }
    sum += realized + unreal;
  }
  return sum;
}

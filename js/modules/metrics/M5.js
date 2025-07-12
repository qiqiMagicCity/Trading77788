// Auto-generated Trading77788 v3
// File: modules/metrics/M5.js
// Date: 2025-07-12

import { buildFifoState, processTradeFIFO } from '../helpers/fifo.js';
import { todayStr } from '../../utils/timeNY.js';

/* Returns {behavior: Number, fifo: Number} */
export default function M5(trades=[]) {
  const today = todayStr();
  const todayTrades = trades.filter(t=>t.date === today);

  let behaviorPL = 0;
  let fifoPL = 0;

  // Historical FIFO state
  const histState = buildFifoState();
  for (const t of trades.filter(r=>r.date < today)) processTradeFIFO(histState, t);

  // Intraday open stacks
  const buyStack = [];   // array of {qty, price}
  const shortStack = []; // array of {qty, price}

  function popFromStack(stack, qtyNeeded) {
    const out = [];
    while (qtyNeeded > 0 && stack.length) {
      const lot = stack[0];
      const use = Math.min(qtyNeeded, lot.qty);
      out.push({qty: use, price: lot.price});
      lot.qty -= use;
      qtyNeeded -= use;
      if (lot.qty === 0) stack.shift();
    }
    return {matched: out, remain: qtyNeeded};
  }

  for (const t of todayTrades) {
    if (t.side === 'BUY') {
      buyStack.push({qty:t.qty, price:t.price});
      processTradeFIFO(histState, t); // open in FIFO too
    } else if (t.side === 'SHORT') {
      shortStack.push({qty:t.qty, price:t.price});
      processTradeFIFO(histState, t);
    } else if (t.side === 'SELL') {
      let qty = t.qty;
      // 1) Match with today's BUY for behavior
      const res1 = popFromStack(buyStack, qty);
      for (const lot of res1.matched) {
        behaviorPL += (t.price - lot.price) * lot.qty;
        fifoPL     += (t.price - lot.price) * lot.qty; // same cost
        qty -= lot.qty;
      }
      // 2) Remaining qty -> historical FIFO
      if (res1.remain > 0) {
        let remaining = res1.remain;
        const callback = match => {
          fifoPL += (match.closePrice - match.openPrice) * match.qty;
          remaining -= match.qty;
        };
        // Create synthetic trade to process
        processTradeFIFO(histState, {...t, qty: res1.remain}, callback);
      }
    } else if (t.side === 'COVER') {
      let qty = t.qty;
      const res1 = popFromStack(shortStack, qty);
      for (const lot of res1.matched) {
        behaviorPL += (lot.price - t.price) * lot.qty;
        fifoPL     += (lot.price - t.price) * lot.qty;
        qty -= lot.qty;
      }
      if (res1.remain > 0) {
        let remaining = res1.remain;
        const callback = match => {
          fifoPL += (match.openPrice - match.closePrice) * match.qty;
          remaining -= match.qty;
        };
        processTradeFIFO(histState, {...t, qty: res1.remain}, callback);
      }
    }
  }

  return {behavior: behaviorPL, fifo: fifoPL};
}

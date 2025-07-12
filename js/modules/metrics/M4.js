// Trading77788 v2.0.0
// File: modules/metrics/M4.js
// Generated 2025-07-12

import { initStacks, pushOpen, popClose } from '../helpers/fifo.js';
import { nowNY } from '../../utils/timeNY.js';

export default function M4(trades = []) {
  const today = nowNY().format('YYYY-MM-DD');
  const stacksBySym = {};
  // Build cost stacks from history **before today**
  for (const t of trades) {
    if (t.date.startsWith(today)) continue;
    if (!stacksBySym[t.symbol]) stacksBySym[t.symbol] = initStacks();
    if (t.side === 'BUY' || t.side === 'SHORT') {
      pushOpen(stacksBySym[t.symbol], t.side, t.qty, t.price);
    } else if (t.side === 'SELL' || t.side === 'COVER') {
      popClose(stacksBySym[t.symbol], t.side, t.qty, t.price);
    }
  }
  // Now iterate today's trades, only SELL/COVER that match historical stacks
  let realized = 0;
  for (const t of trades) {
    if (!t.date.startsWith(today)) continue;
    if (t.side !== 'SELL' && t.side !== 'COVER') continue;
    const stack = stacksBySym[t.symbol];
    if (!stack) continue;
    realized += popClose(stack, t.side, t.qty, t.price);
  }
  return realized;
}

// Auto-generated Trading77788 v3
// File: modules/metrics/M9.js
// Date: 2025-07-12

import { buildFifoState, processTradeFIFO } from '../helpers/fifo.js';

export default function M9(trades=[]) {
  const state = buildFifoState();
  let realized = 0;
  const callback = match => {
    realized += match.direction==='long'
      ? (match.closePrice - match.openPrice) * match.qty
      : (match.openPrice - match.closePrice) * match.qty;
  };
  for (const t of trades) {
    processTradeFIFO(state, t, callback);
  }
  return realized;
}

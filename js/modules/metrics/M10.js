// Auto-generated Trading77788 v3
// File: modules/metrics/M10.js
// Date: 2025-07-12

import { buildFifoState, processTradeFIFO } from '../helpers/fifo.js';

export default function M10(trades=[]) {
  const state = buildFifoState();
  let W=0, L=0;
  const callback = match => {
    const pl = match.direction==='long'
      ? (match.closePrice - match.openPrice) * match.qty
      : (match.openPrice - match.closePrice) * match.qty;
    if (pl > 0) W++;
    else if (pl < 0) L++;
  };
  for (const t of trades) processTradeFIFO(state, t, callback);
  const total = W + L;
  const winRate = total ? (W / total) * 100 : 0;
  return {W,L,winRate};
}

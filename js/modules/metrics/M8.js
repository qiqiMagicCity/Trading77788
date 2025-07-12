// Auto-generated Trading77788 v3
// File: modules/metrics/M8.js
// Date: 2025-07-12

export default function M8(trades=[]) {
  const counts = {B:0,S:0,P:0,C:0};
  for (const t of trades) {
    if (t.side === 'BUY') counts.B++;
    else if (t.side === 'SELL') counts.S++;
    else if (t.side === 'SHORT') counts.P++;
    else if (t.side === 'COVER') counts.C++;
  }
  counts.total = counts.B + counts.S + counts.P + counts.C;
  return counts;
}

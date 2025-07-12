// Trading77788 v2.0.0
// File: modules/helpers/fifo.js
// Generated 2025-07-12

/* FIFO helper utilities: manage cost stacks for long and short positions */
export function initStacks() { return { long: [], short: [] }; }

export function pushOpen(stackObj, side, qty, price) {
  if (side === 'BUY') stackObj.long.push({ qty, price });
  else if (side === 'SHORT') stackObj.short.push({ qty, price });
}

/* Pop qty from stack for closing trade, returns realized P&L (positive or negative) */
export function popClose(stackObj, side, qty, price) {
  let pl = 0;
  const stack = (side === 'SELL') ? stackObj.long : stackObj.short;
  while (qty > 0 && stack.length) {
    const lot = stack[0];
    const use = Math.min(qty, lot.qty);
    if (side === 'SELL') pl += (price - lot.price) * use;        // long close
    else /* COVER */ pl += (lot.price - price) * use;            // short close
    lot.qty -= use;
    qty -= use;
    if (lot.qty === 0) stack.shift();
  }
  return pl;
}

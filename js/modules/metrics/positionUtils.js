// js/modules/metrics/positionUtils.js
// Helpers to reconstruct open positions per symbol via FIFO
// Generated 2025-07-12

// Trade object expected: {symbol, side, qty, price, date}
export function buildPositions(trades) {
  const longs = {};
  const shorts = {};

  // Ensure trades sorted by time ascending
  const sorted = [...trades].sort((a,b)=> new Date(a.date) - new Date(b.date));

  for (const t of sorted) {
    const s = t.symbol;
    if (!longs[s]) longs[s] = [];
    if (!shorts[s]) shorts[s] = [];
    const qty = Number(t.qty);
    const price = Number(t.price);
    if (t.side === 'BUY') {
      longs[s].push({qty, price});
    } else if (t.side === 'SELL') {
      // match against longs
      let remaining = qty;
      while (remaining > 0 && longs[s].length) {
        const lot = longs[s][0];
        if (lot.qty > remaining) {
          lot.qty -= remaining;
          remaining = 0;
        } else {
          remaining -= lot.qty;
          longs[s].shift();
        }
      }
      // any excess indicates short selling (should be improbable here)
    } else if (t.side === 'SHORT') {
      shorts[s].push({qty, price});
    } else if (t.side === 'COVER') {
      let remaining = qty;
      while (remaining > 0 && shorts[s].length) {
        const lot = shorts[s][0];
        if (lot.qty > remaining) {
          lot.qty -= remaining;
          remaining = 0;
        } else {
          remaining -= lot.qty;
          shorts[s].shift();
        }
      }
    }
  }

  // Convert to flat array of positions
  const positions = [];
  for (const [sym, lots] of Object.entries(longs)) {
    for (const lot of lots) {
      positions.push({symbol: sym, qty: lot.qty, price: lot.price, direction: 'LONG'});
    }
  }
  for (const [sym, lots] of Object.entries(shorts)) {
    for (const lot of lots) {
      positions.push({symbol: sym, qty: lot.qty, price: lot.price, direction: 'SHORT'});
    }
  }
  return positions;
}

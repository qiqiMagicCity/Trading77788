// FIFO calculation

function computePositions(trades) {
  const symbolLots = {};
  trades.sort((a, b) => new Date(a.date) - new Date(b.date));
  trades.forEach(t => {
    const lots = symbolLots[t.symbol] || (symbolLots[t.symbol] = []);
    let remaining = t.qty;
    let realized = 0;
    const signedQty = (t.side === 'BUY' || t.side === 'COVER') ? t.qty : -t.qty;
    if (signedQty > 0) {
      for (let i = 0; i < lots.length && remaining > 0; ) {
        const lot = lots[i];
        if (lot.qty < 0) {
          const closeQty = Math.min(remaining, -lot.qty);
          realized += (lot.price - t.price) * closeQty;
          lot.qty += closeQty;
          remaining -= closeQty;
          if (lot.qty === 0) lots.splice(i, 1);
          else i++;
        } else i++;
      }
      if (remaining > 0) lots.push({qty: remaining, price: t.price});
    } else {
      remaining = -signedQty;
      for (let i = 0; i < lots.length && remaining > 0; ) {
        const lot = lots[i];
        if (lot.qty > 0) {
          const closeQty = Math.min(remaining, lot.qty);
          realized += (t.price - lot.price) * closeQty;
          lot.qty -= closeQty;
          remaining -= closeQty;
          if (lot.qty === 0) lots.splice(i, 1);
          else i++;
        } else i++;
      }
      if (remaining > 0) lots.push({qty: -remaining, price: t.price});
    }
    t.pl = realized;
    t.closed = remaining === 0;
  });
  const positions = Object.entries(symbolLots).map(([sym, lots]) => {
    const qty = lots.reduce((s, l) => s + l.qty, 0);
    const cost = lots.reduce((s, l) => s + l.qty * l.price, 0);
    return {symbol: sym, qty, avgPrice: qty ? Math.abs(cost) / Math.abs(qty) : 0, last: 0, priceOk: false};
  }).filter(p => p.qty !== 0);
  return positions;
}

function computeIntradayPNL(trades) {
  const today = todayNY();
  const dayTrades = trades.filter(t => t.date === today);
  // Behavior and FIFO perspective
  let behavior = 0;
  let fifo = 0;
  // Implement logic
  return {behavior, fifo};
}

function computeHistPNL(trades) {
  return trades.reduce((s, t) => s + (t.closed ? t.pl : 0), 0);
}
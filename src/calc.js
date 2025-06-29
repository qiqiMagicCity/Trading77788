export function fmtSign(n) {
  const cls = n > 0 ? 'green' : n < 0 ? 'red' : 'white';
  const value = Number(Math.abs(n)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `<span class="\${cls}">\${n < 0 ? '-' : ''}\${value}</span>`;
}

export function fmtDollar(n) {
  return `$ \${fmtSign(n)}`;
}

export function fmtInt(n) {
  return `<span class="white">\${Number(n).toLocaleString()}</span>`;
}

export function fmtWL(w, l) {
  return `<span class="green">W\${w}</span>/<span class="red">L\${l}</span>`;
}

/**
 * Compute statistics required for 8 grid cells.
 * @param {Array} positions - Array of current open positions {symbol, qty, avgPrice}
 * @param {Array} trades - Array of trade objects {symbol, qty, price, side, ts}
 */
export async function computeStats(positions, trades, getPriceFn) {
  // 1. 账户总成本
  let accountCost = 0;
  for (const p of positions) {
    accountCost += p.qty * p.avgPrice;
  }

  // 2. 现有市值
  let marketValue = 0;
  for (const p of positions) {
    const price = await getPriceFn(p.symbol);
    marketValue += p.qty * price;
  }

  // 3. 当前浮动盈亏
  const floatingPL = marketValue - accountCost;

  // Partition trades by today vs historical
  const todayStr = new Date().toISOString().substring(0, 10);
  const closedTrades = trades.filter(t => t.side === 'SELL' && t.matchId); // matched sell sides
  const todayClosed = closedTrades.filter(t => t.ts.startsWith(todayStr));
  const historicalClosed = closedTrades; // all

  let todayRealizedPL = 0;
  let todayWins = 0;
  let todayLosses = 0;
  for (const t of todayClosed) {
    todayRealizedPL += t.pl;
    if (t.pl >= 0) {
      todayWins += 1;
    } else {
      todayLosses += 1;
    }
  }

  let totalTradesToday = trades.filter(t => t.ts.startsWith(todayStr)).length;
  let totalTradesHistory = trades.length;

  let historicalRealizedPL = 0;
  for (const t of historicalClosed) {
    historicalRealizedPL += t.pl;
  }

  return {
    accountCost,
    marketValue,
    floatingPL,
    todayRealizedPL,
    todayWins,
    todayLosses,
    totalTradesToday,
    totalTradesHistory,
    historicalRealizedPL
  };
}

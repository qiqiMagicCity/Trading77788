/**
 * Formatting helpers obeying 功能区 1 规则
 */
function toFixedLocale(n) {
  return Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function fmtDollar(n) {
  const cls = n > 0 ? 'green' : n < 0 ? 'red' : 'white';
  const formatted = `${n < 0 ? '-' : ''}$ ${toFixedLocale(n)}`;
  return `<span class="${cls}">${formatted}</span>`;
}

export function fmtWL(w, l) {
  return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`;
}

export function fmtInt(n) {
  return `<span class="white">${Number(n).toLocaleString()}</span>`;
}

/**
 * Compute eight statistics per specification.
 * Assumes trades array has {symbol, qty, price, side, ts, match_id} and
 * closed trade rows include realized PL in 'pl'.
 */
export async function computeStats(positions, trades, getPriceFn) {
  let accountCost = 0;
  for (const p of positions) accountCost += p.qty * p.avg_price;

  let marketValue = 0;
  for (const p of positions) {
    const px = await getPriceFn(p.symbol);
    marketValue += p.qty * px;
  }

  const floatingPL = marketValue - accountCost;

  const todayStr = new Date().toISOString().substring(0,10);
  const tradesToday = trades.filter(t => t.ts.startsWith(todayStr));
  const closedTrades = trades.filter(t => t.side==='SELL' && t.match_id);

  let todayRealizedPL = 0, todayWins = 0, todayLosses = 0;
  for (const t of closedTrades.filter(t => t.ts.startsWith(todayStr))) {
    todayRealizedPL += t.pl;
    if (t.pl >= 0) todayWins++; else todayLosses++;
  }

  let totalTradesToday = tradesToday.length;
  let totalTradesAll = trades.length;

  let historicalRealizedPL = 0;
  for (const t of closedTrades) historicalRealizedPL += t.pl;

  return {
    accountCost,          // #1
    marketValue,          // #2
    floatingPL,           // #3
    todayRealizedPL,      // #4
    todayWins,            // #5 part
    todayLosses,          // #5 part
    totalTradesToday,     // #6
    totalTradesAll,       // #7
    historicalRealizedPL  // #8
  };
}

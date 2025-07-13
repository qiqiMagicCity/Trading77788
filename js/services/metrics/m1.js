// services/metrics/m1.js
// M1 持仓成本 = 未平仓头寸的建仓价 × 数量（多空合并）

export function calc(trades, prices) {
  if (!Array.isArray(trades)) return { error: "Invalid trades input" };

  let totalCost = 0;

  for (const trade of trades) {
    if (trade.type === 'BUY') {
      totalCost += trade.price * trade.quantity;
    } else if (trade.type === 'SHORT') {
      totalCost += trade.price * Math.abs(trade.quantity);
    }
  }

  return { value: totalCost.toFixed(2) };
}
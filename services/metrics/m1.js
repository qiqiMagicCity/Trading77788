// js/services/metrics/m1.js
export function calc(trades, prices) {
  if (!Array.isArray(trades)) return { value: 0 };
  const totalCost = trades
    .filter(t => t.type === 'B') // 只统计买入
    .reduce((sum, t) => sum + t.qty * t.price, 0);
  return { value: parseFloat(totalCost.toFixed(2)) };
}
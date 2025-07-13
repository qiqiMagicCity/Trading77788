import type { Trade, Position } from 'packages/core';

export function derivePositions(trades: Trade[]): Position[] {
  // Very naive implementation: sum qty per symbol
  const map = new Map<string, { qty: number; total: number }>();
  trades.forEach((t) => {
    const m = map.get(t.symbol) ?? { qty: 0, total: 0 };
    m.qty += t.qty;
    m.total += t.price * t.qty;
    map.set(t.symbol, m);
  });
  return Array.from(map.entries()).map(([symbol, { qty, total }]) => ({
    symbol,
    qty,
    entryPrice: qty !== 0 ? total / qty : 0
  }));
}

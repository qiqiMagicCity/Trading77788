// M3.js - 持仓浮盈
// Generated 2025-07-12
import { buildPositions } from './positionUtils.js';

/**
 * @param trades Array
 * @param prices Object mapping symbol -> price
 */
export default function M3(trades = [], prices = {}) {
  const pos = buildPositions(trades);
  return pos.reduce((sum, p) => {
    const current = Number(prices[p.symbol]) || 0;
    if (p.direction === 'LONG') {
      return sum + (current - p.price) * p.qty;
    } else {
      // SHORT
      return sum + (p.price - current) * p.qty;
    }
  }, 0);
}

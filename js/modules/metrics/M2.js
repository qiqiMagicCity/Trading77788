// M2.js - 持仓市值
// Generated 2025-07-12
import { buildPositions } from './positionUtils.js';

/**
 * @param trades Array
 * @param prices Object mapping symbol -> latest price
 */
export default function M2(trades = [], prices = {}) {
  const pos = buildPositions(trades);
  return pos.reduce((sum, p) => {
    const current = Number(prices[p.symbol]) || 0;
    return sum + Math.abs(current * p.qty);
  }, 0);
}

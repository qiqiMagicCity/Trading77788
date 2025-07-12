// M1.js - 持仓成本
// Generated 2025-07-12
import { buildPositions } from './positionUtils.js';

/**
 * @param trades Array of trade objects
 * @returns number 持仓成本(绝对值总和)
 */
export default function M1(trades = []) {
  const pos = buildPositions(trades);
  return pos.reduce((sum, p) => sum + Math.abs(p.price * p.qty), 0);
}

// Auto-generated Trading77788 v3
// File: js/modules/metrics/M12.js
// Date: 2025-07-12

import { startOfMonth } from '../../utils/dateHelpers.js';
import dailyPL from './dailyPL.js';
export default function M12(trades=[], closeMap={}, todayStr){
  const start = startOfMonth(todayStr);
  return dailyPL(trades, closeMap, start, todayStr);
}

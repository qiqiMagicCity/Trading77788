// Auto-generated Trading77788 v3
// File: js/modules/metrics/M11.js
// Date: 2025-07-12

import { startOfWeek } from '../../utils/dateHelpers.js';
import dailyPL from './dailyPL.js';

export default function M11(trades=[], closeMap={}, todayStr){
  const start = startOfWeek(todayStr);
  return dailyPL(trades, closeMap, start, todayStr);
}

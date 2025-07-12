// Auto-generated Trading77788 v3
// File: js/modules/metrics/M13.js
// Date: 2025-07-12

import { startOfYear } from '../../utils/dateHelpers.js';
import dailyPL from './dailyPL.js';
export default function M13(trades=[], closeMap={}, todayStr){
  const start = startOfYear(todayStr);
  return dailyPL(trades, closeMap, start, todayStr);
}

// modules/metrics-engine.js (generated 2025-07-12)
import { computeStats } from './metrics/computeStats.js';

export function computeAllMetrics(trades, positions){
  return computeStats(trades, positions);
}

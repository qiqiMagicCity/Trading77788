// metrics-engine.js - Spec-based M1-M3 implementation
// Generated 2025-07-12
import M1 from './metrics/M1.js';
import M2 from './metrics/M2.js';
import M3 from './metrics/M3.js';

/**
 * Compute M1-M3 metrics according to spec.
 * @param {trades:Array, prices:Object} param0
 * @returns {M1:number, M2:number, M3:number}
 */
export function computeAllMetrics({trades = [], prices = {}}) {
  const metrics = {
    M1: M1(trades),
    M2: M2(trades, prices),
    M3: M3(trades, prices),
  };
  return metrics;
}

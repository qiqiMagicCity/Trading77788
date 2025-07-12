// metrics-render.js
// Generated 2025-07-12
import { computeAllMetrics } from './modules/metrics-engine.js';
import { nyNow } from './utils/timeNY.js';

async function getTrades() {
  // tries to load from localStorage 'trades'
  try {
    return JSON.parse(localStorage.getItem('trades') || '[]');
  } catch(e) {
    console.error('Failed to load trades', e);
    return [];
  }
}

async function getPrices(symbols) {
  // naive approach: rely on existing global priceService if present
  const prices = {};
  if (window.priceService) {
    for (const s of symbols) {
      try {
        const p = await window.priceService.getPrice(s);
        if (p) prices[s] = p;
      } catch(e) {}
    }
  }
  return prices;
}

async function render() {
  const trades = await getTrades();
  const symbols = [...new Set(trades.map(t=>t.symbol))];
  const prices = await getPrices(symbols);
  const metrics = computeAllMetrics({trades, prices});
  const m1El = document.querySelector('#stat-1');
  const m2El = document.querySelector('#stat-2');
  const m3El = document.querySelector('#stat-3');
  if (m1El) m1El.textContent = '$ ' + metrics.M1.toFixed(2);
  if (m2El) m2El.textContent = '$ ' + metrics.M2.toFixed(2);
  if (m3El) m3El.textContent = '$ ' + metrics.M3.toFixed(2);
}

// initial run and re-run every 30s
render();
setInterval(render, 30000);

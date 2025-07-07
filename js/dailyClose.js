/**
 * dailyClose.js - UI glue for manual daily close update + export
 */
import { fetchDailyClose } from './services/finnhubService.js';
import { exportPrices } from './db/idb.js';

function getTrackedSymbols() {
  try {
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    return [...new Set(trades.map(t => t.symbol).filter(Boolean))];
  } catch (e) {
    return [];
  }
}

async function updateTodayCloses() {
  const symbols = getTrackedSymbols();
  if (!symbols.length) {
    alert('没有需要更新的标的');
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const sym of symbols) {
    try {
      await fetchDailyClose(sym, today);
      console.info('Fetched close for', sym);
    } catch (e) {
      console.warn('Failed fetching close for', sym, e);
    }
  }
  alert('收盘价已更新');
}

document.addEventListener('DOMContentLoaded', () => {
  const btnExport = document.getElementById('exportPrices');
  if (btnExport) btnExport.addEventListener('click', exportPrices);

  const btnUpdate = document.getElementById('updateClose');
  if (btnUpdate) btnUpdate.addEventListener('click', updateTodayCloses);
});
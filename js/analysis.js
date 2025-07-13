
// analysis.js — 无缓存版本，只读 data/trades.json

import { getTrades } from './utils/dataStore.js';

window.addEventListener('load', async () => {
  const pnlTable = document.querySelector('#pnl-table tbody');
  try {
    const trades = await getTrades();
    if (!trades || trades.length === 0) {
      pnlTable.innerHTML = '<tr><td colspan="4">无数据</td></tr>';
      return;
    }

    const symbolStats = {};
    for (const t of trades) {
      if (!symbolStats[t.symbol]) symbolStats[t.symbol] = { count: 0, total: 0 };
      const value = (t.side === 'SELL' || t.side === 'COVER') ? t.qty * t.price : 0;
      symbolStats[t.symbol].count++;
      symbolStats[t.symbol].total += value;
    }

    pnlTable.innerHTML = Object.entries(symbolStats).map(([symbol, s]) =>
      `<tr><td>${symbol}</td><td>${s.count}</td><td>${s.total.toFixed(2)}</td></tr>`
    ).join('');
  } catch (e) {
    pnlTable.innerHTML = '<tr><td colspan="4">分析失败</td></tr>';
    console.error('❌ 分析模块错误:', e);
  }
});

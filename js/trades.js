
// trades.js — 无缓存版本，只读 data/trades.json

import { getTrades } from './utils/dataStore.js';

window.addEventListener('load', async () => {
  const table = document.querySelector('#trade-table tbody');
  try {
    const trades = await getTrades();
    if (!trades || trades.length === 0) {
      table.innerHTML = '<tr><td colspan="5">暂无交易记录</td></tr>';
      return;
    }
    table.innerHTML = trades.map(t => 
      `<tr><td>${t.date}</td><td>${t.symbol}</td><td>${t.side}</td><td>${t.qty}</td><td>${t.price}</td></tr>`
    ).join('');
  } catch (e) {
    table.innerHTML = '<tr><td colspan="5">加载失败</td></tr>';
    console.error('❌ 无法加载 trades.json:', e);
  }
});

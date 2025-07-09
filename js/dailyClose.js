/**
 * dailyClose.js – v7.80 合并版
 * 导出全历史收盘价为 close_prices.json，避免多文件散乱
 */

function exportCurrentPricesMerged() {
  const rows = document.querySelectorAll('#positions tr[data-symbol]');
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const todayCloses = {};
  rows.forEach(row => {
    const symbol = row.getAttribute('data-symbol');
    const priceCell = row.querySelector('.col-price');
    if (symbol && priceCell) {
      const price = parseFloat(priceCell.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(price)) {
        todayCloses[symbol] = price;
      }
    }
  });
  if (Object.keys(todayCloses).length === 0) {
    alert('未检测到实时价格，请先刷新或等待价格加载完成再导出。');
    return;
  }

  // 读取本地已有历史（如果有）
  let allCloses = {};
  try {
    const raw = localStorage.getItem('close_prices');
    if (raw) allCloses = JSON.parse(raw);
  } catch (e) { allCloses = {}; }

  // 合并：以日期为 key，存 symbol-price 对象
  allCloses[today] = todayCloses;

  // 同步存到 localStorage，方便页面/其他导入
  localStorage.setItem('close_prices', JSON.stringify(allCloses));

  // 导出完整合并后的文件
  const blob = new Blob([JSON.stringify(allCloses, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = 'close_prices.json';
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);

  alert(`已成功导出历史${Object.keys(allCloses).length}天，今日${Object.keys(todayCloses).length}条收盘价到 close_prices.json。`);
}

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exportPrices')?.addEventListener('click', exportCurrentPricesMerged);
});

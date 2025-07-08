/**
 * dailyClose.js – v7.34
 * 简化版收盘价导出：页面获取到实时价格后，可一键导出到本地 JSON 文件
 * 依赖：页面中“导出收盘价格”按钮 id="exportPrices"，价格列 class="col-price"，每行持仓 tr[data-symbol]
 */
function exportCurrentPrices() {
  const rows = document.querySelectorAll('#positions tr[data-symbol]');
  const data = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  rows.forEach(row => {
    const symbol = row.getAttribute('data-symbol');
    const priceCell = row.querySelector('.col-price');
    if (symbol && priceCell) {
      const price = parseFloat(priceCell.textContent.replace(/[^0-9.]/g, ''));
      if (!isNaN(price)) {
        data.push({ symbol, date: today, close: price });
      }
    }
  });
  if (!data.length) {
    alert('未检测到实时价格，请先刷新或等待价格加载完成再导出。');
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = now.toISOString().replace(/[:T]/g, '-').slice(0, 19);
  a.download = `prices_${stamp}.json`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  alert(`已成功导出 ${data.length} 条收盘价到本地文件。`);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exportPrices')?.addEventListener('click', exportCurrentPrices);
});

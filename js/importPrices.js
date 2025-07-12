/**
 * importPrices.js v7.34
 * 支持导入通过 dailyClose.js 导出的简化 JSON 文件到 IndexedDB
 */
import { putPrice } from './lib/idb.js';

function importPrices() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const list = Array.isArray(json) ? json : (json.prices || []);
      if (!Array.isArray(list)) throw new Error('文件格式不正确，未找到价格数组');
      let imported = 0;
      for (const r of list) {
        if (r && r.symbol && r.date && typeof r.close === 'number') {
          await putPrice(r.symbol, r.date, r.close, 'import');
          imported++;
        }
      }
      alert(`成功导入 ${imported} 条收盘价`);
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
  };
  input.click();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('importPrices')?.addEventListener('click', importPrices);
});

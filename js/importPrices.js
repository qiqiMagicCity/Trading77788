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

      // 新增：兼容日期嵌套对象（close_prices.json）和价格数组两种格式
      let list = [];
      if (Array.isArray(json)) {
        list = json;
      } else if (json.prices && Array.isArray(json.prices)) {
        list = json.prices;
      } else if (typeof json === 'object' && json !== null) {
        // 兼容 close_prices.json 格式 { "2025-07-07": { ... }, ... }
        for (const [date, symbols] of Object.entries(json)) {
          if (typeof symbols === 'object' && symbols !== null) {
            for (const [symbol, close] of Object.entries(symbols)) {
              if (typeof close === 'number' && isFinite(close)) {
                list.push({ symbol, date, close });
              }
            }
          }
        }
      }
      if (!Array.isArray(list) || list.length === 0) throw new Error('文件格式不正确，未找到有效收盘价数据');
      let imported = 0;
      for (const r of list) {
        if (r && r.symbol && r.date && typeof r.close === 'number' && isFinite(r.close)) {
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

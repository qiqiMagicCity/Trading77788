
/**
 * importPrices.js v7.21
 * UI handler for importing exported price JSON into IndexedDB.
 */
import { putPrice } from './db/idb.js';

function importPrices(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(!Array.isArray(data)){
        alert('文件格式不正确，应为价格 JSON 数组');
        return;
      }
      let imported = 0;
      for(const item of data){
        if(item && item.symbol && item.date && typeof item.close === 'number'){
          await putPrice(item.symbol, item.date, item.close, item.source || 'import');
          imported++;
        }
      }
      alert(`成功导入 ${imported} 条收盘价`);
    }catch(err){
      alert('导入失败: '+err.message);
    }
  };
  input.click();
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('importPrices')?.addEventListener('click', importPrices);
});

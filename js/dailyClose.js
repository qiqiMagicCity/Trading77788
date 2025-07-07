/**
 * dailyClose.js – v7.27
 * 手动“导出收盘价格”逻辑
 * 1. 仅允许在美东时间 16:00 之后执行
 * 2. 读取当前持仓的实时价格作为当天收盘价写入 IndexedDB
 * 3. 写入完成后立即导出所有收盘价 JSON
 */
import { fetchRealtimePrice } from './services/priceService.js';
import { putPrice, exportPrices } from './db/idb.js';

function getTrackedSymbols(){
  try{
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    return [...new Set(trades.map(t=>t.symbol).filter(Boolean))];
  }catch(e){
    return [];
  }
}

/** 判断当前是否已收盘（纽约时间 >=16:00:00） */
function afterMarketCloseNY(){
  const now = new Date();
  const nyOffset = -4; // EDT (夏令时); 若需支持 EST 冬令时可进一步完善
  const nyMillis = now.getTime() + (nyOffset*3600 + now.getTimezoneOffset()*60)*1000;
  const nyDate = new Date(nyMillis);
  return nyDate.getHours() > 16 || (nyDate.getHours() === 16 && nyDate.getMinutes() >= 0);
}

async function snapshotTodayClose(){
  if(!afterMarketCloseNY()){
    alert('目前还未收盘（纽约时间16:00）。请在收盘后再保存收盘价');
    return false;
  }
  const symbols = getTrackedSymbols();
  if(!symbols.length){
    alert('没有需要保存收盘价的标的');
    return false;
  }
  let savedCount = 0;
  const today = new Date().toISOString().slice(0,10);
  for(const sym of symbols){
    try{
      const price = await fetchRealtimePrice(sym);
      if(price != null){
        await putPrice(sym, today, price, 'snapshot');
        savedCount++;
      }
    }catch(err){
      console.warn('保存收盘价失败', sym, err);
    }
  }
  return savedCount;
}

document.addEventListener('DOMContentLoaded', ()=>{
  const btnExport = document.getElementById('exportPrices');
  if(btnExport){
    btnExport.addEventListener('click', async ()=>{
      const saved = await snapshotTodayClose();
      if(saved > 0){
        await exportPrices();
        alert(`已保存 ${saved} 条收盘价并导出文件`);
      }else{
        alert('未保存任何收盘价（可能重复或未获取到实时价格）');
      }
    });
  }
});
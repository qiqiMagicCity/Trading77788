/**
 * dailyClose.js - UI glue for manual daily close update + export
 */
import { fetchDailyClose } from './services/finnhubService.js';
import { getPrice, exportPrices } from './db/idb.js';

function getTrackedSymbols() {
  try {
    const trades = JSON.parse(localStorage.getItem('trades') || '[]');
    return [...new Set(trades.map(t => t.symbol).filter(Boolean))];
  } catch (e) {
    return [];
  }
}


async function ensureLatestClose(){
  const symbols = getTrackedSymbols();
  if(!symbols.length) return;
  // compute previous trading day string (YYYY-MM-DD)
  const now = new Date();
  let d = new Date(now);
  d.setDate(d.getDate()-1);
  // skip weekend
  while(d.getDay()===0 || d.getDay()===6){
    d.setDate(d.getDate()-1);
  }
  const dateStr = d.toISOString().slice(0,10);
  const fetchTasks = [];
  for(const sym of symbols){
    const existing = await getPrice(sym, dateStr);
    if(!existing){
      fetchTasks.push(fetchDailyClose(sym, dateStr));
    }
  }
  if(fetchTasks.length){
    try{
      await Promise.all(fetchTasks);
      console.info('已补全最新收盘价', dateStr);
    }catch(e){
      console.warn('获取收盘价失败', e);
    }
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
  if (btnExport) btnExport.addEventListener('click', async ()=>{await ensureLatestClose(); await exportPrices();});

  const btnUpdate = document.getElementById('updateClose');
  if (btnUpdate) btnUpdate.addEventListener('click', updateTodayCloses);
});
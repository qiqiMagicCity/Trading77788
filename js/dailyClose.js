/**
 * dailyClose.js – v7.33
 * 手动“导出收盘价格”逻辑
/* ---- Added in v7.30: lightweight browser-side real‑time price fetch ---- */
/** 获取 Finnhub API Key（先尝试 KEY.txt，再退回到默认内置 key） */
async function getFinnhubKey(){
  try{
    const txt = await fetch('KEY.txt').then(r=> r.ok ? r.text() : '');
    const m = txt.match(/Finnhub key：([\w]+)/);
    return (m?m[1]:'d19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg').trim();
  }catch(e){
    console.warn('无法读取 KEY.txt，使用默认内置 key', e);
    return 'd19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
  }
}

/** 浏览器环境下按需请求实时价（单次，返回 number 或 null） */
async function fetchRealtimePrice(symbol){
  const token = await getFinnhubKey();
  if(!token) return null;
  try{
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`);
    const json = await res.json();
    return json.c || json.current || null;
  }catch(err){
    console.warn('实时价格获取失败', symbol, err);
    return null;
  }
}
/* ----------------------------------------------------------------------- */

 * 1. 仅允许在美东时间 16:00 之后执行
 * 2. 读取当前持仓的实时价格作为当天收盘价写入 IndexedDB
 * 3. 写入完成后立即导出所有收盘价 JSON
 */
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

/**
 * 从当前持仓表格中读取已渲染的实时价格。要求 <tr> 具有 data-symbol，
 * 实时价单元格带有类名 .col-price
 */
function getDomPrice(symbol){
  const row = document.querySelector(`tr[data-symbol="${symbol}"]`);
  if(row){
    const cell = row.querySelector('.col-price');
    if(cell){
      const val = parseFloat(cell.textContent.trim().replace(/[^0-9.]/g,''));
      return isNaN(val) ? null : val;
    }
  }
  return null;
}

async async function snapshotTodayClose(){
  if(!afterMarketCloseNY()){
  const proceed = confirm('纽约市场尚未收盘，是否仍使用当前价格作为收盘价继续导出？');
  if(!proceed) return false;
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
      let price = await fetchRealtimePrice(sym);
      if(price == null){ price = getDomPrice(sym); }
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

// v7.32 added stable export handler
const btnExport = document.getElementById('exportPrices');
if (btnExport) {
  btnExport.addEventListener('click', async () => {
    try {
      const saved = await snapshotTodayClose();
      // 无论是否有新增记录，均尝试导出，避免“无反应”体验
      await exportPrices();
      alert(`已导出收盘价文件，新增 ${saved} 条记录（可能为 0）`);
    } catch (err) {
      console.error('导出收盘价失败', err);
      alert('导出收盘价失败：' + err.message);
    }
  });
}


/**
 * closeRecorder.js v1.0 (ES Module)
 * Automatically records daily closing prices using Finnhub quotes.
 */
import { fetchRealtimePrice, saveDailyClose } from './services/priceService.js';

const DELAY_PER_CALL_MS = 1200; // 50 req/min
const ET_OFFSET_HOURS = -4; // EDT offset
const MARKET_CLOSE_HH = 16, MARKET_CLOSE_MM = 0;
function toET(d){
  return new Date(d.getTime() + (ET_OFFSET_HOURS*3600 + d.getTimezoneOffset()*60)*1000);
}
function nextCloseTime(){
  const now = new Date();
  let target = toET(now);
  if (target.getHours() > MARKET_CLOSE_HH || (target.getHours() === MARKET_CLOSE_HH && target.getMinutes() >= MARKET_CLOSE_MM)){
    target.setDate(target.getDate()+1);
  }
  while(target.getDay()===0 || target.getDay()===6){
    target.setDate(target.getDate()+1);
  }
  target.setHours(MARKET_CLOSE_HH, MARKET_CLOSE_MM, 5, 0);
  const utcMillis = target.getTime() - ET_OFFSET_HOURS*3600*1000;
  return new Date(utcMillis - now.getTimezoneOffset()*60*1000);
}
function getTrackedSymbols(){
  const trades = JSON.parse(localStorage.getItem('trades')||'[]');
  return [...new Set(trades.map(t=>t.symbol))];
}
async function recordClose(){
  const syms = getTrackedSymbols();
  if(!syms.length){ scheduleNext(); return; }
  const delays = syms.map((s,i)=>({s, delay: i*DELAY_PER_CALL_MS}));
  for(const {s,delay} of delays){
    setTimeout(async()=>{
      try{
        const price = await fetchRealtimePrice(s);
        if(price!=null){
          saveDailyClose(s, price);
        }
      }catch(e){ console.error('closeRecorder', s, e); }
      if(delay === delays[delays.length-1].delay){
        scheduleNext();
      }
    }, delay);
  }
}
function scheduleNext(){
  const wait = nextCloseTime().getTime() - Date.now();
  setTimeout(recordClose, Math.max(wait, 60*1000));
}
window.recordDailyCloseNow = recordClose;
scheduleNext();

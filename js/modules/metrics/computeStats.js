// modules/metrics/computeStats.js - extracted from legacy dashboard stats() (generated 2025-07-12)
import { NY_TZ } from '../../utils/timeNY.js';

// date util
const fmtISO = (d)=> d.toISOString().slice(0,10);

/**
 * computeStats(trades, positions)
 * @param {Array} trades
 * @param {Array} positions
 * @returns {Object} metrics
 */
export function computeStats(trades=[], positions=[]) {

  // Account cost & value
  const cost  = positions.reduce((sum,p)=> sum + Math.abs(p.qty * p.avgPrice), 0);
  const value = positions.reduce((sum,p)=> p.priceOk!==false ? sum + Math.abs(p.qty)*p.last : sum, 0);

  // Floating PnL (long: (last-avg)*qty, short: (avg-last)*abs(qty))
  const floating = positions.reduce((sum,p)=>{
    if(p.qty===0 || p.priceOk===false) return sum;
    const pl = p.qty>0 ? (p.last - p.avgPrice)*p.qty : (p.avgPrice - p.last)*Math.abs(p.qty);
    return sum + pl;
  },0);

  // today string (NY)
  const latestTradeDate = trades.reduce((d,t)=> t.date>d ? t.date : d, '');
  const todayStr = latestTradeDate || new Date().toLocaleDateString('en-CA',{ timeZone:NY_TZ });

  const todayTrades = trades.filter(t=> t.date === todayStr);

  // Build net buy/sell map for daily unrealized
  const dayNetMap = {};
  todayTrades.forEach(t=>{
    const rec = dayNetMap[t.symbol] || (dayNetMap[t.symbol] = { qty:0, cost:0 });
    const signedQty = (t.side==='BUY' || t.side==='COVER') ? t.qty : -t.qty;
    rec.qty  += signedQty;
    rec.cost += signedQty * t.price;
  });

  const dailyUnrealized = positions.reduce((sum,p)=>{
    if(p.qty===0 || p.priceOk===false || typeof p.prevClose !== 'number') return sum;
    const net = dayNetMap[p.symbol] || { qty:0, cost:0 };
    const carryQty = p.qty - net.qty;                // qty held since prev close
    const avgPrev  = p.prevClose;
    const plCarry  = (p.qty>0 ? (p.last - avgPrev) : (avgPrev - p.last)) * carryQty;
    return sum + plCarry;
  },0);

  // Realized PnL helpers
  const todayReal     = todayTrades.reduce((sum,t)=> sum + (Number(t.pl)||0), 0);
  const intradayReal  = todayTrades.filter(t=>t.intraday).reduce((s,t)=> s+(Number(t.pl)||0),0);
  const histReal      = trades.reduce((sum,t)=> sum + (Number(t.pl)||0), 0);

  // Win / loss
  const wins = trades.filter(t=> t.pl>0).length;
  const losses = trades.filter(t=> t.pl<0).length;
  const winRate = (wins+losses) ? wins/(wins+losses) : null;

  // Date bucket helpers
  const wtdReal = calcRangeReal(trades,'week');
  const mtdReal = calcRangeReal(trades,'month');
  const ytdReal = calcRangeReal(trades,'year');

  return {
    cost, value, floating,
    todayReal, intradayReal, dailyUnrealized,
    todayTrades: todayTrades.length,
    totalTrades: trades.length,
    histReal,
    winRate,
    wtdReal, mtdReal, ytdReal
  };
}

/** helper to calc realized pnl within given range boundary */
function calcRangeReal(trades, mode='week') {
  if(trades.length===0) return 0;
  const now = luxon.DateTime.now().setZone(NY_TZ);
  let boundary;
  if(mode==='week') boundary = now.startOf('week');     // Sun
  else if(mode==='month') boundary = now.startOf('month');
  else if(mode==='year') boundary = now.startOf('year');
  return trades.reduce((sum,t)=> {
    const dt = luxon.DateTime.fromISO(t.date || '', { zone: NY_TZ });
    if(dt < boundary) return sum;
    return sum + (Number(t.pl)||0);
  },0);
}

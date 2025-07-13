// js/metricsService.js
// Calculates high-level metrics (M1–M13) using pure functions
export function calcAll({ trades, livePrices }) {
  // Simple placeholder implementations; replace with your real algorithms
  const M1 = calcTotalCost(trades);
  const M2 = calcCurrentMarketValue(trades, livePrices);
  const M3 = M2 - M1;
  // ...continue through M13
  return {
    M1, M2, M3,
    // fill others with null for now
    M4: null, M5: null, M6: null, M7: null,
    M8: null, M9: null, M10: null, M11: null, M12: null, M13: null
  };
}

function calcTotalCost(trades){
  return trades.reduce((sum,t)=>sum+(t.qty * t.price * (t.side==='BUY'?1:-1)),0);
}

function calcCurrentMarketValue(trades, prices){
  if(!prices) return null;
  let map = prices; // expected {symbol: price}
  return trades.reduce((sum,t)=>{
    const mktPrice = map[t.symbol] || t.price;
    return sum + (t.qty * mktPrice * (t.side==='BUY'?1:-1));
  },0);
}
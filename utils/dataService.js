// utils/dataService.js
// Centralized data loader: trades.json + Finnhub live prices
export async function loadAll() {
  const trades = await fetch('trades.json').then(r=>r.json());
  // placeholder for close prices if needed in future
  let closes = null;
  try {
    closes = await fetch('close_prices.json').then(r=>r.json());
  } catch(_) { closes = null; }

  // Attempt to get live prices via existing priceService (Finnhub)
  let livePrices = null;
  try {
    const { getLivePrices } = await import('../js/services/priceService.js');
    livePrices = await getLivePrices();
  } catch(e) {
    console.warn('Live price fetch failed', e);
  }
  return { trades, closes, livePrices };
}

// loadTrades: only trades.json, no localStorage fallback
export async function loadTrades(){
  try{
    const res = await fetch('trades.json');
    return res.ok ? await res.json() : [];
  }catch(e){
    console.error('loadTrades failed', e);
    return [];
  }
}

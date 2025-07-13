export async function getTrades(){
  try{
    const res = await fetch('./trades.json');
    if(!res.ok) return [];
    const raw = await res.json();
    return Array.isArray(raw) ? raw : (raw.trades || []);
  }catch(e){ console.error('getTrades',e); return []; }
}

export async function getClosePrices(){
  try{
    const res = await fetch('data/close_prices.json');
    if(!res.ok) return {};
    const raw = await res.json();
    return raw;
  }catch(e){ console.error('getClosePrices', e); return {}; }
}

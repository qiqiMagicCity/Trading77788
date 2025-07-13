// utils/dataStore.js
export async function getTrades(){
  try{
    const res = await fetch('data/trades.json');
    if(!res.ok) return [];
    const raw = await res.json();
    return Array.isArray(raw) ? raw : (raw.trades || []);
  }catch(e){ console.error('getTrades',e); return []; }
}
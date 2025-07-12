export async function getTrades(){
  try{
    const res = await fetch('./trades.json');
    if(!res.ok) return [];
    const raw = await res.json();
    return Array.isArray(raw) ? raw : (raw.trades || []);
  }catch(e){ console.error('getTrades error',e); return []; }
}
export async function getDailyClose(){
  try{
    const res = await fetch('./dailyClose.json');
    if(!res.ok) return [];
    return await res.json();
  }catch(e){ return []; }
}
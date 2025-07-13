// Auto-generated dataService.js
export async function loadTrades(){
    const res = await fetch('data/trades.json');
    return res.ok ? await res.json() : [];
}
export async function loadCloses(){
    const res = await fetch('data/close_prices.json');
    return res.ok ? await res.json() : {};
}

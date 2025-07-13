
export async function getTrades() {
    const res = await fetch('/data/trades.json');
    return await res.json();
}

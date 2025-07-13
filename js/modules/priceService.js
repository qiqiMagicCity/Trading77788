
export async function getClosePrices() {
    const res = await fetch('/data/close_prices.json');
    return await res.json();
}

/**
 * Fetch latest price via Finnhub. Falls back to localStorage cache on failure.
 */
export async function getPrice(symbol) {
  const key = import.meta.env.VITE_FINNHUB_KEY;
  const cacheKey = `price_\${symbol}`;
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=\${symbol}&token=\${key}`);
    if (!res.ok) throw new Error('Network fail');
    const data = await res.json();
    if (data.c) {
      localStorage.setItem(cacheKey, JSON.stringify({ price: data.c, ts: Date.now() }));
      return data.c;
    }
  } catch(e) {
    // ignore
  }
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached).price;
  }
  return 0;
}

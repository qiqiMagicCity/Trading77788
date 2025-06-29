/**
 * getPrice: query Finnhub, fallback cache
 */
export async function getPrice(symbol) {
  const cacheKey = `price_${symbol}`;
  const token = import.meta.env.VITE_FINNHUB_KEY;
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`);
    const data = await res.json();
    if (data.c) {
      localStorage.setItem(cacheKey, JSON.stringify({p:data.c, t:Date.now()}));
      return data.c;
    }
  } catch(e) { /* ignore */ }
  const cache = localStorage.getItem(cacheKey);
  if (cache) return JSON.parse(cache).p;
  return 0;
}

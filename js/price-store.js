
/* price-store.js  (added in v7.7.17)
 * Persistent price cache with incremental fetch from Finnhub.
 * Strategy:
 *   1. Cache stored in localStorage under key "prices".
 *   2. getClose(symbol, ymd) returns cached value or fetches once and persists.
 *   3. Finnhub free plan (60 req/min) is sufficient because we fetch only missing days.
 */
(function(global){
  const LS_KEY = 'prices';
  const cache = load();
  const FINNHUB_KEY = global.FINNHUB_KEY || (typeof FINNHUB_KEY!=='undefined'?FINNHUB_KEY:null);

  function load(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); }catch(e){ return {}; }
  }
  function save(){ localStorage.setItem(LS_KEY, JSON.stringify(cache)); }

  async function fetchClose(symbol, ymd){
    if(!FINNHUB_KEY){ console.warn('No FINNHUB_KEY set; cannot fetch prices online'); return null; }
    const from = Math.floor(new Date(ymd+'T00:00:00Z').getTime()/1000);
    const to   = from + 24*3600;
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    try{
      const r = await fetch(url);
      if(!r.ok) throw new Error(r.status);
      const j = await r.json();
      if(j.c && j.c.length){
        const px = Number(j.c[0]);
        cache[symbol]??={};
        cache[symbol][ymd]=px;
        save();
        return px;
      }
    }catch(e){
      console.error('fetchClose failed', e);
    }
    return null;
  }

  async function getClose(symbol, ymd){
    if(cache?.[symbol]?.[ymd]!=null) return cache[symbol][ymd];
    return await fetchClose(symbol, ymd);
  }

  global.priceStore = { cache, getClose };
})(window);

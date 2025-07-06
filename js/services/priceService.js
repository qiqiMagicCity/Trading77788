
/**
 * priceService.js
 * Handles historical daily and realtime price retrieval and caching.
 * - Daily prices fetched from Alpha Vantage TIME_SERIES_DAILY_ADJUSTED.
 * - Realtime (1‑min cache) fetched from Finnhub quote endpoint.
 * Both stored in /data/price-history.json with atomic writes.
 */

const fs = window.require ? window.require('fs') : null;    // Electron or NW.js
const path = window.require ? window.require('path') : null;

const PRICE_PATH = path ? path.join(process.cwd(), 'data', 'price-history.json') : '/data/price-history.json';
const KEY_PATH = path ? path.join(process.cwd(), 'KEY.txt') : '/KEY.txt';

function getApiKeys() {
  let alpha = '';
  let finnhub = '';
  try {
    const content = fs.readFileSync(KEY_PATH, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      if (/ALPHA/i.test(line)) {
        const m = line.match(/([A-Z0-9]{10,})/);
        if (m) alpha = m[1];
      }
      if (/FINNHUB/i.test(line)) {
        const m = line.match(/([A-Z0-9]{10,})/);
        if (m) finnhub = m[1];
      }
    });
  } catch (e) { console.error('Cannot read KEY.txt', e); }
  return { alpha, finnhub };
}

function readPriceHistory() {
  try {
    if (!fs.existsSync(PRICE_PATH)) {
      fs.mkdirSync(path.dirname(PRICE_PATH), { recursive: true });
      fs.writeFileSync(PRICE_PATH, '{}', 'utf8');
    }
    const raw = fs.readFileSync(PRICE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Resetting corrupted price-history.json', e);
    fs.writeFileSync(PRICE_PATH, '{}', 'utf8');
    return {};
  }
}

function atomicWrite(obj) {
  const tmp = PRICE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, PRICE_PATH);
}

export async function fetchDailySeries(symbols = []) {
  const { alpha } = getApiKeys();
  const priceHistory = readPriceHistory();
  for (const sym of symbols) {
    const now = new Date();
    const todayStr = now.toISOString().substring(0,10);
    if (priceHistory[sym]?.daily?.[todayStr]) continue; // already have today's close
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${sym}&outputsize=compact&apikey=${alpha}`;
      const res = await fetch(url);
      const json = await res.json();
      const series = json['Time Series (Daily)'];
      if (series) {
        if (!priceHistory[sym]) priceHistory[sym] = { daily:{}, realtime:{} };
        Object.entries(series).forEach(([date, o])=>{
          priceHistory[sym].daily[date] = parseFloat(o['4. close']);
        });
        console.log('[AV] daily updated', sym);
      } else {
        console.warn('[AV] daily missing', sym, json);
      }
    } catch(e) {
      console.error('[AV] daily error', sym, e);
    }
  }
  atomicWrite(priceHistory);
  return priceHistory;
}

const RT_CACHE_MS = 60*1000;

export async function fetchRealtimePrice(symbol) {
  const { finnhub } = getApiKeys();
  const priceHistory = readPriceHistory();
  const rt = priceHistory[symbol]?.realtime || {};
  const latestTs = Object.keys(rt).sort().pop();
  if (latestTs && (Date.now() - new Date(latestTs).getTime()) < RT_CACHE_MS) {
    return rt[latestTs];
  }
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhub}`;
    const res = await fetch(url);
    const json = await res.json();
    const price = json.c || json.current || null;
    if (price != null) {
      if (!priceHistory[symbol]) priceHistory[symbol] = { daily:{}, realtime:{} };
      priceHistory[symbol].realtime[new Date().toISOString()] = price;
      atomicWrite(priceHistory);
    }
    return price;
  } catch(e) {
    console.error('[Finnhub] realtime error', symbol, e);
    return null;
  }
}

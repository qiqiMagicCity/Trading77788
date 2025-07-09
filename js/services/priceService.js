
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


/**
 * saveDailyClose
 * Persist today's close price into daily map.
 * Called by closeRecorder.js after market close.
 */
export function saveDailyClose(symbol, price) {
  const priceHistory = readPriceHistory();
  const todayStr = new Date().toISOString().substring(0,10);
  if (!priceHistory[symbol]) priceHistory[symbol] = { daily: {}, realtime: {} };
  priceHistory[symbol].daily[todayStr] = price;
  atomicWrite(priceHistory);
}


////////////////////////////////////////////////////////////////////////////////////
// === Finnhub daily candle backfill helpers (added v7.18) ===
/**
 * fetchDailyCandles
 * @param {string} symbol
 * @param {number} fromEpoch   seconds since 1970‑01‑01
 * @param {number} toEpoch     seconds
 * @returns {Promise<{c:number[], t:number[]}>}
 */
export async function fetchDailyCandles(symbol, fromEpoch, toEpoch) {
  const { finnhub } = getApiKeys();
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromEpoch}&to=${toEpoch}&token=${finnhub}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.s !== 'ok') {
    throw new Error(json.s || 'Finnhub candle error');
  }
  return json; // includes arrays c (close), t (epoch sec)
}

/**
 * saveDailyClosesBulk
 * Persist bulk close data arrays into price-history.json
 */
export function saveDailyClosesBulk(symbol, tArray, cArray) {
  const priceHistory = readPriceHistory();
  if (!priceHistory[symbol]) priceHistory[symbol] = { daily: {}, realtime: {} };
  for (let i = 0; i < tArray.length; i++) {
    const dateStr = new Date(tArray[i] * 1000).toISOString().substring(0, 10);
    priceHistory[symbol].daily[dateStr] = cArray[i];
  }
  atomicWrite(priceHistory);
}

/**
 * getTrackedSymbols
 * Returned cached list of symbols from localStorage.trades OR keys in price history.
 */
export async function getTrackedSymbols() {
  try {
    if (typeof localStorage !== 'undefined') {
      const trades = JSON.parse(localStorage.getItem('trades') || '[]');
      const syms = [...new Set(trades.map(t => t.symbol).filter(Boolean))];
      if (syms.length) return syms;
    }
  } catch (e) {
    console.warn('[getTrackedSymbols] localStorage unavailable', e);
  }
  const priceHistory = readPriceHistory();
  return Object.keys(priceHistory);
}

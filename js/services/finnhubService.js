/**
 * finnhubService.js - fetch daily close from Finnhub with queue + caching
 */
import { apiQueue } from './apiQueue.js';
import { putPrice, getPrice } from '../db/idb.js';

const TOKEN_KEY = 'FINNHUB_TOKEN';
const API_BASE = 'https://finnhub.io/api/v1';

/**
 * Get stored token from localStorage.
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

/**
 * Fetch daily close price for a symbol and date.
 * @param {string} symbol
 * @param {string} date YYYY-MM-DD (UTC)
 */
export async function fetchDailyClose(symbol, date) {
  // first check cache
  const cached = await getPrice(symbol, date);
  if (cached) return cached.close;

  const fromTs = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000);
  const toTs = Math.floor(new Date(date + 'T23:59:59Z').getTime() / 1000);

  const url = `${API_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${fromTs}&to=${toTs}&token=${getToken()}`;
  return apiQueue.enqueue(() =>
    fetch(url)
      .then(r => {
        if (!r.ok) {
          const err = new Error('HTTP ' + r.status);
          err.status = r.status;
          throw err;
        }
        return r.json();
      })
      .then(json => {
        if (json && json.c && json.c.length) {
          const close = json.c[0];
          putPrice(symbol, date, close, 'finnhub');
          return close;
        }
        throw new Error('No close data');
      })
  );
}
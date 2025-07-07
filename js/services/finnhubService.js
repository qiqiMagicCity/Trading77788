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
  return localStorage.getItem(TOKEN_KEY) || 'd19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
}

/**
 * Fetch daily close price for a symbol and date.
 * @param {string} symbol
 * @param {string} date YYYY-MM-DD (UTC)
 */
/stock/candle?symbol=${symbol}&resolution=D&from=${fromTs}&to=${toTs}&token=${getToken()}`;
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

/**
 * Fallback: fetch daily close from Alpha Vantage if Finnhub fails or returns no data.
 */
async function fetchAlphaClose(symbol, date){
  const apiKey = '7WVA9HZ4BCR6BR30'; // fallback demo key – consider moving to KEY.txt
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
  try{
    const json = await fetch(url).then(r=>r.json());
    const series = json['Time Series (Daily)'];
    if(series && series[date] && series[date]['4. close']){
       const close = parseFloat(series[date]['4. close']);
       await putPrice(symbol, date, close, 'alphavantage');
       return close;
    }
  }catch(e){ console.warn('Alpha Vantage fallback failed', e); }
  return null;
}



/**
 * Fallback: fetch daily close from Alpha Vantage if Finnhub fails or returns no data.
 */
async function fetchAlphaClose(symbol, date){
  const apiKey = '7WVA9HZ4BCR6BR30'; // fallback demo key – consider moving to KEY.txt
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
  try{
    const json = await fetch(url).then(r=>r.json());
    const series = json['Time Series (Daily)'];
    if(series && series[date] && series[date]['4. close']){
       const close = parseFloat(series[date]['4. close']);
       await putPrice(symbol, date, close, 'alphavantage');
       return close;
    }
  }catch(e){ console.warn('Alpha Vantage fallback failed', e); }
  return null;
}


async function fetchFinnhubDailyClose(symbol, date){
  const fromTs = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000);
  const toTs = Math.floor(new Date(date + 'T23:59:59Z').getTime() / 1000);
  const url = `${API_BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${fromTs}&to=${toTs}&token=${getToken()}`;
  try{
    const json = await apiQueue.enqueue(()=>fetch(url).then(r=>r.json()));
    if(json && json.c && json.c.length){
       const close = json.c[0];
       await putPrice(symbol, date, close, 'finnhub');
       return close;
    }
  }catch(e){ console.warn('Finnhub fetch error', e); }
  return null;
}

export async function fetchDailyClose(symbol, date){
   const cached = await getPrice(symbol, date);
   if(cached) return cached.close;
   const fh = await fetchFinnhubDailyClose(symbol, date);
   if(fh!=null) return fh;
   const av = await fetchAlphaClose(symbol, date);
   if(av!=null) return av;
   throw new Error('无法获取收盘价');
}

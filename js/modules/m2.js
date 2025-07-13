
import { getTrades, getClosePrices } from './utils.js';

const trades = await getTrades();
const prices = await getClosePrices();
const latest = prices['2025-07-12'];

let marketValue = 0;
trades.forEach(t => {
    const price = latest[t.symbol] || 0;
    if (['BUY', 'SHORT'].includes(t.type)) {
        marketValue += Math.abs(price * t.qty);
    }
});

document.getElementById('m2').textContent = 'M2 市值: $' + marketValue.toFixed(2);

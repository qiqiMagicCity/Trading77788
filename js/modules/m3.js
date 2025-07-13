
import { getTrades, getClosePrices } from './utils.js';

const trades = await getTrades();
const prices = await getClosePrices();
const latest = prices['2025-07-12'];

let unrealized = 0;
trades.forEach(t => {
    const price = latest[t.symbol] || 0;
    if (t.type === 'BUY') {
        unrealized += (price - t.price) * t.qty;
    } else if (t.type === 'SHORT') {
        unrealized += (t.price - price) * t.qty;
    }
});

document.getElementById('m3').textContent = 'M3 浮盈: $' + unrealized.toFixed(2);

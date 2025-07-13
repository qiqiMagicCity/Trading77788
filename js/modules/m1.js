
import { getTrades } from './utils.js';

const trades = await getTrades();
const totalCost = trades
    .filter(t => ['BUY', 'SHORT'].includes(t.type))
    .reduce((sum, t) => sum + Math.abs(t.price * t.qty), 0);

document.getElementById('m1').textContent = 'M1 总成本: $' + totalCost.toFixed(2);

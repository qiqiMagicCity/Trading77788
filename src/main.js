import { computeStats, fmtDollar, fmtWL, fmtInt } from './calc.js';
import { getPrice } from './price.js';
import { fetchPositions, fetchTrades } from './data.js';

async function render() {
  try {
    const positions = await fetchPositions();
    const trades = await fetchTrades();

    const stats = await computeStats(positions, trades, getPrice);

    // Map to DOM
    document.querySelector('#stat-1').innerHTML = `<div class="card-title">账户总成本</div><div class="card-value">\${fmtDollar(stats.accountCost)}</div>`;
    document.querySelector('#stat-2').innerHTML = `<div class="card-title">现有市值</div><div class="card-value">\${fmtDollar(stats.marketValue)}</div>`;
    document.querySelector('#stat-3').innerHTML = `<div class="card-title">当前浮动盈亏</div><div class="card-value">\${fmtDollar(stats.floatingPL)}</div>`;
    document.querySelector('#stat-4').innerHTML = `<div class="card-title">当日已实现盈亏</div><div class="card-value">\${fmtDollar(stats.todayRealizedPL)}</div>`;
    document.querySelector('#stat-5').innerHTML = `<div class="card-title">当日盈亏笔数</div><div class="card-value">\${fmtWL(stats.todayWins, stats.todayLosses)}</div>`;
    document.querySelector('#stat-6').innerHTML = `<div class="card-title">当日交易次数</div><div class="card-value">\${fmtInt(stats.totalTradesToday)}</div>`;
    document.querySelector('#stat-7').innerHTML = `<div class="card-title">累计交易次数</div><div class="card-value">\${fmtInt(stats.totalTradesHistory)}</div>`;
    document.querySelector('#stat-8').innerHTML = `<div class="card-title">历史已实现盈亏</div><div class="card-value">\${fmtDollar(stats.historicalRealizedPL)}</div>`;

    // Render trades table (simplified)
    const tradesWrap = document.getElementById('trades');
    tradesWrap.innerHTML = trades.map(tr => 
      \`<div>\${tr.ts} - \${tr.symbol} - \${tr.side} \${tr.qty} @ \${tr.price}</div>\`
    ).join('');
  } catch(err) {
    console.error(err);
  }
}

document.getElementById('refresh').addEventListener('click', render);
window.addEventListener('load', render);

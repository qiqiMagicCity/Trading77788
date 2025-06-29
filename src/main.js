import { fetchPositions, fetchTrades } from './data.js';
import { getPrice } from './price.js';
import { computeStats, fmtDollar, fmtWL, fmtInt } from './calc.js';

async function render() {
  try {
    const [positions, trades] = await Promise.all([fetchPositions(), fetchTrades()]);
    const stats = await computeStats(positions, trades, getPrice);

    // Map stats to DOM
    document.getElementById('stat-1').innerHTML = '<div class="card-title">账户总成本</div><div class="card-value">' + fmtDollar(stats.accountCost) + '</div>';
    document.getElementById('stat-2').innerHTML = '<div class="card-title">现有市值</div><div class="card-value">' + fmtDollar(stats.marketValue) + '</div>';
    document.getElementById('stat-3').innerHTML = '<div class="card-title">当前浮动盈亏</div><div class="card-value">' + fmtDollar(stats.floatingPL) + '</div>';
    document.getElementById('stat-4').innerHTML = '<div class="card-title">当日已实现盈亏</div><div class="card-value">' + fmtDollar(stats.todayRealizedPL) + '</div>';
    document.getElementById('stat-5').innerHTML = '<div class="card-title">当日盈亏笔数</div><div class="card-value">' + fmtWL(stats.todayWins, stats.todayLosses) + '</div>';
    document.getElementById('stat-6').innerHTML = '<div class="card-title">当日交易次数</div><div class="card-value">' + fmtInt(stats.totalTradesToday) + '</div>';
    document.getElementById('stat-7').innerHTML = '<div class="card-title">累计交易次数</div><div class="card-value">' + fmtInt(stats.totalTradesAll) + '</div>';
    document.getElementById('stat-8').innerHTML = '<div class="card-title">历史已实现盈亏</div><div class="card-value">' + fmtDollar(stats.historicalRealizedPL) + '</div>';

    // Render trades list (simplified)
    const tradesEl = document.getElementById('trades');
    tradesEl.innerHTML = trades.map(t => {
      const time = new Date(t.ts).toLocaleString();
      return `<div>${time} - ${t.symbol} - ${t.side} ${t.qty} @ ${t.price}</div>`;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('refresh').addEventListener('click', render);
window.addEventListener('load', render);

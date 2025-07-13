// Dashboard logic

let positions = [];
let trades = [];

// 示例数据填充 (测试视觉, 正式可移除)
const defaultTrades = [
  {date:'2025-07-12',symbol:'AAPL',side:'BUY',qty:100,price:200},
  {date:'2025-07-12',symbol:'TSLA',side:'SELL',qty:50,price:300},
  {date:'2025-07-12',symbol:'GOOGL',side:'SHORT',qty:20,price:150},
  {date:'2025-07-12',symbol:'MSFT',side:'COVER',qty:30,price:250},
  {date:'2025-07-12',symbol:'AMZN',side:'BUY',qty:40,price:350},
  {date:'2025-07-12',symbol:'META',side:'SELL',qty:60,price:450},
  {date:'2025-07-12',symbol:'NVDA',side:'BUY',qty:70,price:550},
  {date:'2025-07-12',symbol:'AMD',side:'SHORT',qty:80,price:650}
];

function loadDashboardData() {
  trades = loadData('trades', JSON.stringify(defaultTrades));
  positions = safeCall(() => FIFO.computePositions(trades), []);
}

function calcStats() {
  const cost = positions.reduce((sum, p) => sum + Math.abs(p.qty * p.avgPrice), 0);
  const value = positions.reduce((sum, p) => sum + Math.abs(p.qty * p.last), 0);
  const floating = positions.reduce((sum, p) => p.qty > 0 ? (p.last - p.avgPrice) * p.qty : (p.avgPrice - p.last) * Math.abs(p.qty), 0);
  // ... Implement full M1-M13 using FIFO and equityCurve
  return { cost, value, floating /* etc */ };
}

function renderStats() {
  const s = calcStats();
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = '';
  const titles = ['持仓成本', '持仓市值', '持仓浮盈', '今天持仓平仓盈利', '今日日内交易盈利', '今日总盈利变化', '今日交易次数', '累计交易次数', '所有历史平仓盈利', '胜率', 'WTD', 'MTD', 'YTD'];
  titles.forEach((title, i) => {
    const box = document.createElement('div');
    box.className = 'box';
    let value = Utils.fmtDollar(s[title.toLowerCase()] || 0);
    if (title === '今日日内交易盈利') {
      value = `<span>交易视角：${Utils.fmtDollar(0)}</span><span>FIFO视角：${Utils.fmtDollar(0)}</span>`;
    }
    box.innerHTML = `<div class="box-title">${title}</div><div class="box-value">${value}</div>`;
    grid.appendChild(box);
  });
}

// Render positions table
function renderPositions() {
  const tbl = document.getElementById('positions');
  tbl.innerHTML = '<tr><th>logo</th><th>代码</th><th>中文名</th><th>实时价格</th><th>目前持仓</th><th>持仓单价</th><th>持仓金额</th><th>盈亏平衡点</th><th>当日盈亏</th><th>总收益</th><th>历史交易次数</th><th>详情</th></tr>';
  positions.forEach(p => {
    // Fill row with example
    const row = document.createElement('tr');
    row.innerHTML = `<td><img src="logos/${p.symbol}.png" class="logo"></td><td>${p.symbol}</td><td>${SymbolCN[p.symbol] || ''}</td><td>${p.last.toFixed(2)}</td><td>${p.qty}</td><td>${p.avgPrice.toFixed(2)}</td><td>${(p.qty * p.avgPrice).toFixed(2)}</td><th>${p.avgPrice.toFixed(2)}</th><td>${0.00}</td><td>${0.00}</td><td>${trades.filter(t => t.symbol === p.symbol).length}</td><td><a href="stock.html?symbol=${p.symbol}" class="details">详情</a></td>`;
    tbl.appendChild(row);
  });
}

// Render trades table
function renderTrades() {
  const tbl = document.getElementById('trades');
  tbl.innerHTML = '<tr><th>日期</th><th>星期</th><th>图标</th><th>代码</th><th>中文名</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>详情</th></tr>';
  trades.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${t.date}</td><td>${getWeekIdx(t.date)}</td><td><img src="logos/${t.symbol}.png" class="logo"></td><td>${t.symbol}</td><td>${SymbolCN[t.symbol] || ''}</td><td class="${t.side.toLowerCase()}">${t.side}</td><td>${t.price.toFixed(2)}</td><td>${t.qty}</td><td>${(t.qty * t.price).toFixed(2)}</td><td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>`;
    tbl.appendChild(row);
  });
}

// Render symbols list (8 per row)
function renderSymbolsList() {
  const list = document.getElementById('symbols-list');
  list.innerHTML = '';
  const symbols = [...new Set(trades.map(t => t.symbol))];
  symbols.forEach(sym => {
    const a = document.createElement('a');
    a.href = 'stock.html?symbol=' + sym;
    a.textContent = sym;
    a.className = 'symbol-tag';
    list.appendChild(a);
  });
}

// Add trade modal
function addTrade() {
  // Create modal with fields
}

// Update prices
function updatePrices() {
  // Fetch from Finnhub
}

// Update clocks
function updateClocks() {
  const fmt = tz => new Date().toLocaleTimeString('en-GB', {timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit'});
  const clocks = document.getElementById('clocks');
  if (clocks) clocks.innerHTML = `纽约：${fmt('America/New_York')} | 瓦伦西亚：${fmt('Europe/Madrid')} | 上海：${fmt('Asia/Shanghai')}`;
  const nyDate = document.getElementById('nyDate');
  if (nyDate) nyDate.innerHTML = new Intl.DateTimeFormat('zh-CN', {timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'}).format(new Date());
}

// Load and render
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  renderStats();
  renderPositions();
  renderTrades();
  renderSymbolsList();
  document.getElementById('fab').addEventListener('click', addTrade);
  setInterval(updatePrices, 60000);
  updateClocks();
  setInterval(updateClocks, 1000);
});
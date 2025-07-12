// Dashboard logic

let positions = [];
let trades = [];

function loadDashboardData() {
  trades = loadData('trades', '[]');
  positions = safeCall(() => FIFO.computePositions(trades), []);
}

function stats() {
  const cost = positions.reduce((sum, p) => sum + Math.abs(p.qty * p.avgPrice), 0);
  const value = positions.reduce((sum, p) => sum + Math.abs(p.qty * p.last), 0);
  const floating = positions.reduce((sum, p) => p.qty > 0 ? (p.last - p.avgPrice) * p.qty : (p.avgPrice - p.last) * Math.abs(p.qty), 0);
  // ... Implement full M1-M13 using FIFO and equityCurve
  return { cost, value, floating /* etc */ };
}

// Render stats (13 boxes, M5 double line)
function renderStats() {
  const s = stats();
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
    // Fill row
  });
}

// Render trades table
function renderTrades() {
  const tbl = document.getElementById('trades');
  tbl.innerHTML = '<tr><th>日期</th><th>星期</th><th>图标</th><th>代码</th><th>中文名</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>详情</th></tr>';
  trades.forEach(t => {
    // Fill row
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

// Load and render
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  renderStats();
  renderPositions();
  renderTrades();
  renderSymbolsList();
  document.getElementById('fab').addEventListener('click', addTrade);
  setInterval(updatePrices, 60000);
});
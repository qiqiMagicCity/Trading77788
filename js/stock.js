// Stock logic

function renderStockDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const symbol = urlParams.get('symbol');
  if (!symbol) return;
  document.getElementById('symbol-title').textContent = symbol + ' 详情';
  const trades = loadData('trades', '[]');
  const symbolTrades = trades.filter(t => t.symbol === symbol);
  const tbl = document.getElementById('stock-trades');
  tbl.innerHTML = '<tr><th>日期</th><th>星期</th><th>图标</th><th>代码</th><th>中文名</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>详情</th></tr>';
  symbolTrades.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${t.date}</td><td>${getWeekIdx(t.date)}</td><td><img src="logos/${t.symbol}.png" class="logo"></td><td>${t.symbol}</td><td>${SymbolCN[t.symbol] || ''}</td><td>${t.side}</td><td>${t.price.toFixed(2)}</td><td>${t.qty}</td><td>${(t.qty * t.price).toFixed(2)}</td><td></td>`;
    tbl.appendChild(row);
  });
  // Add details like total pl
  const details = document.getElementById('stock-details');
  details.innerHTML = '总收益: ' + Utils.fmtDollar(0); // Implement
}

document.addEventListener('DOMContentLoaded', renderStockDetails);
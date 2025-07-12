// Trades logic

function renderAllTrades() {
  const tbl = document.getElementById('all-trades');
  tbl.innerHTML = '<tr><th>日期</th><th>星期</th><th>图标</th><th>代码</th><th>中文名</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>详情</th></tr>';
  const trades = loadData('trades', '[]');
  trades.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${t.date}</td><td>${getWeekIdx(t.date)}</td><td><img src="logos/${t.symbol}.png" class="logo" onerror="this.style.visibility='hidden';"></td><td>${t.symbol}</td><td>${SymbolCN[t.symbol] || ''}</td><td class="${t.side.toLowerCase()}">${t.side}</td><td>${t.price.toFixed(2)}</td><td>${t.qty}</td><td>${(t.qty * t.price).toFixed(2)}</td><td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>`;
    tbl.appendChild(row);
    // Add edit/del buttons if needed
  });
}

document.addEventListener('DOMContentLoaded', renderAllTrades);
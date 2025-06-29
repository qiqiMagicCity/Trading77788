(async function(){
  const urlParams = new URLSearchParams(location.search);
  const ticker = urlParams.get('ticker') || '';
  document.getElementById('stockTitle').textContent = ticker;

  const allTrades = loadTrades();
  const tradesAll = allTrades.filter(t=>t.ticker===ticker);
  tradesAll.sort((a,b)=>a.date.localeCompare(b.date));

  const rows = fifoRows(tradesAll);

  // summary
  const metrics = fifoMetrics(tradesAll);
  const price = await getPrice(ticker);
  const pl = (price-metrics.avgCost)*metrics.netQty;

  const summary = document.getElementById('stockSummary');
  const box=(title,val)=>{
    const d=document.createElement('div');
    d.className='box';
    d.innerHTML=`<h4>${title}</h4><p>${fmt(val)}</p>`;
    summary.appendChild(d);
  };
  box('净持仓', metrics.netQty);
  box('持仓均价', metrics.avgCost);
  box('现价', price);
  box('浮盈亏', pl);

  // trade history
  const tbody=document.querySelector('#tradeTable tbody');
  tbody.innerHTML='';
  rows.forEach((r,idx)=>{
    const t = tradesAll[idx];
    const weekday = ['日','一','二','三','四','五','六'][new Date(t.date).getDay()];
    const amtHtml = (t.type==='sell'||t.type==='cover'||t.type==='short') ? `<span class="red">${r.amount.toFixed(2)}</span>` : r.amount.toFixed(2);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${t.date} 周${weekday}</td>
      <td>${r.index}</td>
      <td>${t.type}</td>
      <td>${t.price}</td>
      <td>${t.quantity}</td>
      <td>${amtHtml}</td>
      <td>${fmt(r.breakeven)}</td>
      <td>${fmt(r.showPNL)}</td>
      <td>${r.netAfter}</td>
      <td><button data-id="${idx}" class="delBtn">删除</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.delBtn').forEach(btn=>{
    btn.onclick=()=>{
      const i=parseInt(btn.dataset.id);
      const trade = tradesAll[i];
      const all = loadTrades();
      const index = all.indexOf(trade);
      if(index>-1){deleteTrade(index);location.reload();}
    };
  });
})();

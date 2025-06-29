(async function(){
  const urlParams = new URLSearchParams(location.search);
  const ticker = urlParams.get('ticker') || '';
  document.getElementById('stockTitle').textContent = ticker;

  const tradesAll = loadTrades().filter(t=>t.ticker===ticker);
  tradesAll.sort((a,b)=>a.date.localeCompare(b.date));

  // summary
  const metrics = fifoMetrics(tradesAll);
  const price = await getPrice(ticker);
  const pl = (price-metrics.avgCost)*metrics.netQty;

  const summary = document.getElementById('stockSummary');
  const box=(title,val)=>{
    const d=document.createElement('div');
    d.className='box';
    d.innerHTML=`<h4>${title}</h4><p>${val}</p>`;
    summary.appendChild(d);
  };
  box('净持仓', metrics.netQty);
  box('持仓均价', fmt(metrics.avgCost));
  box('现价', fmt(price));
  box('浮盈亏', fmt(pl));

  // trade history
  const tbody=document.querySelector('#tradeTable tbody');
  tbody.innerHTML='';
  let runningCnt=0;
  tradesAll.forEach((t,idx)=>{
    const weekday = ['日','一','二','三','四','五','六'][new Date(t.date).getDay()];
    if(t.type==='buy') runningCnt += t.quantity;
    else if(t.type==='sell') runningCnt -= t.quantity;
    else if(t.type==='short') runningCnt -= t.quantity;
    else if(t.type==='cover') runningCnt += t.quantity;
    const amt = t.price*t.quantity;
    const amtHtml = (t.type==='sell'||t.type==='cover'||t.type==='short')?`<span class="red">${amt.toFixed(2)}</span>`:amt.toFixed(2);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${t.date} 周${weekday}</td>
      <td>${idx+1}</td>
      <td>${t.type}</td>
      <td>${t.price}</td>
      <td>${t.quantity}</td>
      <td>${amtHtml}</td>
      <td>${fmt(metrics.avgCost)}</td>
      <td>${fmt(metrics.realized)}</td>
      <td>${runningCnt}</td>
      <td><button data-i="${idx}" class="delBtn">删除</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.delBtn').forEach(btn=>{
    btn.onclick=()=>{
      const i = parseInt(btn.dataset.i);
      const all = loadTrades();
      const trade = tradesAll[i];
      const index = all.findIndex(x=>x===trade);
      if(index>-1){deleteTrade(index);location.reload();}
    };
  });
})();

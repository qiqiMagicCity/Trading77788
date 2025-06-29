
(async function(){
  const url=new URLSearchParams(location.search);
  const ticker=url.get('ticker');
  document.getElementById('title').textContent=ticker;

  const tradesAll=loadTrades();
  const trades=tradesAll.filter(t=>t.ticker===ticker);
  await render(trades);

  async function render(trades){
    const pos=computePosition(trades);
    const price=await fetchPrice(ticker);
    const unreal=(price-pos.avgCost)*pos.netQty;

    // summary
    const box=document.getElementById('stockSummary');
    box.innerHTML='';
    const make=(t,v)=>{const d=document.createElement('div');d.className='summary-box';d.innerHTML=`<h4>${t}</h4><p>${v}</p>`;box.appendChild(d);};
    make('净持仓',pos.netQty);
    make('均价',pos.avgCost.toFixed(2));
    make('现价',price.toFixed(2));
    make('浮盈亏',unreal.toFixed(2));

    // table
    const tbody=document.querySelector('#tradeTable tbody');
    tbody.innerHTML='';
    trades.forEach((t,idx)=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${t.date}</td>
        <td>${mapType(t.type)}</td>
        <td>${t.quantity}</td>
        <td>${t.price}</td>
        <td>
          <button data-i="${idx}" class="delBtn">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.delBtn').forEach(btn=>{
      btn.onclick=()=>{
        const i=parseInt(btn.getAttribute('data-i'));
        const globalIdx = tradesAll.findIndex(x=>x===trades[i]);
        deleteTrade(globalIdx);
        location.reload();
      };
    });
  }

  function mapType(t){
    return ({buy:'买入',sell:'卖出',short:'做空',cover:'回补'})[t]||t;
  }
})();


(function(){
    const urlParams = new URLSearchParams(location.search);
    const ticker = urlParams.get('ticker');
    document.getElementById('title').textContent = ticker;

    const trades = loadTrades().filter(t=>t.ticker===ticker);
    render(trades);

    function render(trades){
        const pos = computePosition(trades);
        const price = getMockMarketPrice(ticker);
        const unreal = (price - pos.avgCost)*pos.netQty;

        document.getElementById('stockSummary').innerHTML = `
          <p>Net Qty: <strong>${pos.netQty}</strong> | Avg Cost: <strong>${pos.avgCost.toFixed(2)}</strong> | Market Price: <strong>${price.toFixed(2)}</strong> | Unrealised: <strong>${unreal.toFixed(2)}</strong></p>
        `;

        const tbody = document.querySelector('#tradeTable tbody');
        tbody.innerHTML = '';
        trades.forEach((t,idx)=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${t.date}</td>
              <td>${t.type}</td>
              <td>${t.quantity}</td>
              <td>${t.price}</td>
              <td>${t.fee||0}</td>
              <td>
                 <button onclick="editTrade(${idx})">Edit</button>
                 <button onclick="removeTrade(${idx})">Del</button>
              </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.editTrade = function(index){
        const tradesAll = loadTrades();
        const filtered = tradesAll.filter(t=>t.ticker===ticker);
        const t = filtered[index];
        const date = prompt('Date',t.date);
        const type = prompt('Type',t.type);
        const price = parseFloat(prompt('Price',t.price));
        const qty = parseFloat(prompt('Qty',t.quantity));
        const fee = parseFloat(prompt('Fee',t.fee||0))||0;
        // find actual index in global array
        const globalIndex = tradesAll.findIndex(tr=>tr===t);
        updateTrade(globalIndex,{date,ticker, type, price, quantity:qty, fee});
        location.reload();
    }

    window.removeTrade = function(index){
        const tradesAll = loadTrades();
        const filtered = tradesAll.filter(t=>t.ticker===ticker);
        const t = filtered[index];
        const globalIndex = tradesAll.findIndex(tr=>tr===t);
        deleteTrade(globalIndex);
        location.reload();
    }
})();

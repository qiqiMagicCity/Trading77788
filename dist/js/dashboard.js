
(function(){
    const trades = loadTrades();
    render(trades);

    document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change',e=>{
        const file = e.target.files[0];
        if(file){
            importJSONFile(file, t=>location.reload());
        }
    });

    document.getElementById('exportBtn').addEventListener('click',()=>exportJSON(loadTrades()));

    document.getElementById('addBtn').addEventListener('click',()=>{
        const date = prompt('Date (YYYY-MM-DD):');
        const ticker = prompt('Ticker:').toUpperCase();
        const type = prompt('Type (buy/sell/short/cover):').toLowerCase();
        const price = parseFloat(prompt('Price:'));
        const qty = parseFloat(prompt('Quantity:'));
        const fee = parseFloat(prompt('Fee:'))||0;
        addTrade({date,ticker,type,price,quantity:qty,fee});
        location.reload();
    });

    function render(trades){
        const {rows,totalMarketValue,unreal} = computePortfolioMetrics(trades);
        document.getElementById('summary').innerHTML = `
            <p>Total Market Value: <strong>${totalMarketValue.toFixed(2)}</strong></p>
            <p>Unrealised P/L: <strong>${unreal.toFixed(2)}</strong></p>
        `;
        const tbody = document.querySelector('#posTable tbody');
        tbody.innerHTML = '';
        rows.forEach(r=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${r.ticker}</td>
              <td>${r.netQty}</td>
              <td>${r.avgCost.toFixed(2)}</td>
              <td>${r.price.toFixed(2)}</td>
              <td>${r.unreal.toFixed(2)}</td>
              <td><a href="stock.html?ticker=${r.ticker}">View</a></td>
            `;
            tbody.appendChild(tr);
        });
    }
})();

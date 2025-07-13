
// addTrade.js – minimal modal form to add a trade entry and download trades.json
(function(){
  const fab = document.getElementById('fab');
  if(!fab) return;
  let modal;
  fab.onclick = ()=>{
    if(!modal){
      modal = document.createElement('div');
      modal.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#0007;display:flex;align-items:center;justify-content:center;z-index:9999;">
        <form id="trade-form" style="background:#222;padding:20px;border-radius:8px;color:#fff;min-width:300px;">
          <h3>添加交易</h3>
          <label>日期 <input type="date" name="date" required></label><br>
          <label>代码 <input type="text" name="symbol" required></label><br>
          <label>方向
            <select name="side">
              <option value="BUY">BUY</option><option value="SELL">SELL</option>
              <option value="SHORT">SHORT</option><option value="COVER">COVER</option>
            </select>
          </label><br>
          <label>价格 <input type="number" step="0.0001" name="price" required></label><br>
          <label>数量 <input type="number" step="1" name="qty" required></label><br>
          <button type="submit">保存</button>
          <button type="button" id="cancel">取消</button>
        </form></div>`;
      document.body.appendChild(modal);
      modal.querySelector('#cancel').onclick=()=>{modal.remove(); modal=null;};
      modal.querySelector('#trade-form').onsubmit = async e=>{
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form).entries());
        data.price = Number(data.price);
        data.qty   = Number(data.qty);
        const res = await fetch('data/trades.json');
        const json = res.ok ? await res.json() : [];
        const trades = Array.isArray(json)? json : (json.trades||[]);
        trades.push({
            date:data.date, symbol:data.symbol.toUpperCase(), side:data.side,
            price:data.price, qty:data.qty, count: trades.length+1
        });
        // download updated file
        const blob = new Blob([JSON.stringify(trades, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trades.json';
        a.click();
        setTimeout(()=> URL.revokeObjectURL(url), 1000);
        alert('已生成新的 trades.json，请替换部署。');
        location.reload();
      };
    }
  };
})();


(async function(){
  const trades = loadTrades();
  await render(trades);

  // 按钮绑定
  document.getElementById('importBtn').onclick = ()=>document.getElementById('fileInput').click();
  document.getElementById('fileInput').onchange = e=>{
    const file=e.target.files[0];
    if(file) importJSONFile(file,()=>location.reload());
  };
  document.getElementById('exportBtn').onclick = ()=>exportJSON(loadTrades());
  document.getElementById('addBtn').onclick = ()=>openModal();

  // 模态框元素
  const modal=document.getElementById('modal');
  document.getElementById('cancelBtn').onclick = ()=>modal.style.display='none';
  document.getElementById('saveTradeBtn').onclick = ()=>{
    const tDate=document.getElementById('tradeDate').value;
    const tTicker=document.getElementById('tradeTicker').value.toUpperCase();
    const tType=document.getElementById('tradeType').value;
    const tPrice=parseFloat(document.getElementById('tradePrice').value);
    const tQty=parseFloat(document.getElementById('tradeQty').value);
    if(!tDate||!tTicker||!tPrice||!tQty) {alert('请完整填写');return;}
    addTrade({date:tDate,ticker:tTicker,type:tType,price:tPrice,quantity:tQty});
    modal.style.display='none';
    location.reload();
  };

  function openModal(){
    document.getElementById('tradeDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('tradeTicker').value='';
    document.getElementById('tradePrice').value='';
    document.getElementById('tradeQty').value='';
    modal.style.display='flex';
  }

  async function render(trades){
    const m = await computeDashboardMetrics(trades);

    // Summary boxes
    const s = document.getElementById('summary');
    s.innerHTML = '';
    const addBox = (title,val)=>{ const div=document.createElement('div');div.className='summary-box';div.innerHTML=`<h4>${title}</h4><p>${val}</p>`;s.appendChild(div);};
    addBox('账户持仓成本', m.accountCost.toFixed(2));
    addBox('当前持仓市值', m.currentValue.toFixed(2));
    addBox('当前浮动盈亏', m.unreal.toFixed(2));
    addBox('今日已实现盈亏', m.dayRealizedPL.toFixed(2));
    addBox('今日盈亏笔数', m.dayRealizedPairs);
    addBox('今日交易次数', m.dayTradeCount);
    addBox('累计交易次数', m.totalTrades);
    addBox('历史已实现盈亏', m.totalRealizedPL.toFixed(2));

    // positions table
    const tbody = document.querySelector('#posTable tbody');
    tbody.innerHTML='';
    m.rows.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${r.ticker}</td>
        <td>${r.netQty}</td>
        <td>${r.avgCost.toFixed(2)}</td>
        <td>${r.price.toFixed(2)}</td>
        <td>${r.unreal.toFixed(2)}</td>
        <td><a href="stock.html?ticker=${r.ticker}">查看</a></td>
      `;
      tbody.appendChild(tr);
    });
  }
})();

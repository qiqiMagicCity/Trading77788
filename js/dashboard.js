const zones=[{l:'纽约',tz:'America/New_York'},{l:'瓦伦西亚',tz:'Europe/Madrid'},{l:'上海',tz:'Asia/Shanghai'}];
function tick(){
  const wrap=document.getElementById('clocks');
  wrap.innerHTML='';
  zones.forEach(z=>{
    const t=new Intl.DateTimeFormat('zh-CN',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:z.tz}).format(new Date());
    const span=document.createElement('span');
    span.textContent=`${z.l} ${t}`;
    wrap.appendChild(span);
  });
}
setInterval(tick,1000);tick();

// import/export
document.getElementById('importBtn').onclick=()=>{
  const f=document.createElement('input');
  f.type='file';f.accept='.json';
  f.onchange=e=>importJSON(e.target.files[0],()=>location.reload());
  f.click();
};
document.getElementById('exportBtn').onclick=exportJSON;

// modal controls
const modal=document.getElementById('modal');
document.getElementById('addBtn').onclick=()=>{
  modal.style.display='flex';
  document.getElementById('tDate').value=new Date().toISOString().slice(0,10);
};
document.getElementById('cancel').onclick=()=>modal.style.display='none';
document.getElementById('saveTrade').onclick=()=>{
  const t={
    date:document.getElementById('tDate').value,
    ticker:document.getElementById('tTicker').value.trim().toUpperCase(),
    type:document.getElementById('tType').value,
    price:+document.getElementById('tPrice').value,
    quantity:+document.getElementById('tQty').value
  };
  if(!t.date||!t.ticker||!t.price||!t.quantity){alert('请完整填写');return;}
  addTrade(t);
  modal.style.display='none';
  location.reload();
};

// main render
(async function(){
  const trades=loadTrades();
  const todayStr=new Date().toISOString().slice(0,10);

  // group by ticker
  const byTicker={};
  trades.forEach(t=>{
    (byTicker[t.ticker]=byTicker[t.ticker]||[]).push(t);
  });

  let accountCost=0,currentValue=0,unreal=0;
  let histRealized=0;
  const posRows=[];
  for(const [ticker,arr] of Object.entries(byTicker)){
    const metrics=fifoMetrics(arr);
    histRealized += metrics.realized;
    const price = await getPrice(ticker);
    const pl = (price-metrics.avgCost)*metrics.netQty;
    unreal += pl;
    accountCost += metrics.avgCost*Math.abs(metrics.netQty);
    currentValue += price*Math.abs(metrics.netQty);
    posRows.push({
      ticker,
      netQty:metrics.netQty,
      avgCost:metrics.avgCost,
      pl,
      breakeven: metrics.breakeven,
      histRealized: metrics.realized,
      tradeCount: arr.length,
      price
    });
  }

  // today stats
  const todayTrades = trades.filter(t=>t.date===todayStr);
  // calculate realized by pairing across stock groups using fifoRows
  let dayRealized=0,dayPairs=0;
  Object.values(byTicker).forEach(arr=>{
    const todayArr = arr.filter(t=>t.date===todayStr);
    if(todayArr.length){
      const rows = fifoRows(todayArr);
      const realized = rows[rows.length-1].accRealized;
      dayRealized += realized;
      dayPairs += rows.filter(r=>r.showPNL!==0).length;
    }
  });

  // summary grid
  const summary = document.getElementById('summary');
  const box=(title,val)=>{
    const d=document.createElement('div');
    d.className='box';
    d.innerHTML=`<h4>${title}</h4><p>${typeof val==='string'?val:fmt(val)}</p>`;
    summary.appendChild(d);
  };
  box('账户总成本',accountCost);
  box('现有市值',currentValue);
  box('当前浮动盈亏',unreal);
  box('当日已实现盈亏',dayRealized);
  box('当日盈亏笔数',dayPairs);
  box('当日交易次数',todayTrades.length);
  box('累计交易次数',trades.length);
  box('历史已实现盈亏',histRealized);

  // positions table
  const posBody=document.querySelector('#posTable tbody');
  posBody.innerHTML='';
  posRows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${r.ticker}</td>
      <td>${r.netQty}</td>
      <td>${fmt(r.avgCost)}</td>
      <td>${fmt(r.pl)}</td>
      <td>${fmt(r.breakeven)}</td>
      <td>${fmt(r.histRealized)}</td>
      <td>${r.tradeCount}</td>
      <td><a href="stock.html?ticker=${r.ticker}">详情</a></td>
    `;
    posBody.appendChild(tr);
  });

  // recent trades
  const recentBody=document.querySelector('#recentTable tbody');
  const recent=[...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100);
  recentBody.innerHTML='';
  recent.forEach((t,idx)=>{
    const amt=t.price*t.quantity;
    const amtHtml = (t.type==='sell'||t.type==='cover'||t.type==='short')?`<span class="red">${amt.toFixed(2)}</span>`:amt.toFixed(2);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${t.date}</td>
      <td>${t.ticker}</td>
      <td>${t.type}</td>
      <td>${t.price}</td>
      <td>${t.quantity}</td>
      <td>${amtHtml}</td>
      <td><a href="stock.html?ticker=${t.ticker}">详情</a></td>
      <td><button data-id="${idx}" class="delBtn">删除</button></td>
    `;
    recentBody.appendChild(tr);
  });
  recentBody.querySelectorAll('.delBtn').forEach(btn=>{
    btn.onclick=()=>{
      const idx=parseInt(btn.dataset.id);
      const sorted=[...loadTrades()].sort((a,b)=>b.date.localeCompare(a.date));
      const trade=sorted[idx];
      const all=loadTrades();
      const realIndex=all.indexOf(trade);
      if(realIndex>-1){deleteTrade(realIndex);location.reload();}
    };
  });

})();

// === v1.0 Summary Override ===
(function(){
  try{
    const summary = document.getElementById('summary');
    if(!summary) return;
    // clear old
    summary.innerHTML='';
    
const money = n=>{
  const cls = n>0?'green':n<0?'red':'white';
  const abs = Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `<span class="${cls}">${n<0?'-':''}$ ${abs}</span>`;
};

      return `<span class="${cls}">$ ${Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
    };
    const count = n=>`<span class="white">${n}</span>`;
    const winloss = (w,l)=>`<span class="green">W${w}</span>/<span class="red">L${l}</span>`;
    // compute wins / losses for today
    let wins=0,losses=0;
    Object.values(byTicker).forEach(arr=>{
      const todayArr = arr.filter(t=>t.date===todayStr);
      if(todayArr.length){
        const rows = fifoRows(todayArr);
        rows.forEach(r=>{
          if(r.showPNL>0) wins++;
          else if(r.showPNL<0) losses++;
        });
      }
    });
    const data=[
      ['账户总成本',accountCost,money],
      ['现有市值',currentValue,money],
      ['当前浮动盈亏',unreal,money],
      ['当日已实现盈亏',dayRealized,money],
      ['当日盈亏笔数',[wins,losses],winloss],
      ['当日交易次数',todayTrades.length,count],
      ['累计交易次数',trades.length,count],
      ['历史已实现盈亏',histRealized,money]
    ];
    data.forEach(([title,val,fmt])=>{
      const d=document.createElement('div');
      d.className='box';
      const htmlVal = Array.isArray(val)?fmt(...val):fmt(val);
      d.innerHTML=`<h4>${title}</h4><p>${htmlVal}</p>`;
      summary.appendChild(d);
    });
  }catch(e){
    console.error('summary override error',e);
  }
})();

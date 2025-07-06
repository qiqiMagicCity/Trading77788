
(function(){
  // ---- utilities ----
  function numberColor(v){
    if(v>0) return 'green';
    if(v<0) return 'red';
    return 'white';
  }
  function formatDate(d){
    return d.toISOString().slice(0,10);
  }
  function weekOfYear(d){
    // ISO week number
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNr = (target.getUTCDay() + 6)%7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0,1);
    if(target.getUTCDay()!==4){
      target.setUTCDate(target.getUTCDate() + ((4-target.getUTCDay())+7)%7);
    }
    const weekNo = 1 + Math.ceil((firstThursday - target)/604800000);
    return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2,'0');
  }
  function monthKey(d){
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth()+1).padStart(2,'0');
  }
  function renderClocks(){
    const fmt = tz => new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour12:false});
    document.getElementById('clocks').innerText =
      `纽约：${fmt('America/New_York')} | 瓦伦西亚：${fmt('Europe/Madrid')} | 上海：${fmt('Asia/Shanghai')}`;
  }
  setInterval(renderClocks,1000);
  renderClocks();

  // ---- data ----
  const trades = JSON.parse(localStorage.getItem('trades')||'[]');
  if(!Array.isArray(trades) || trades.length===0){
    console.warn('没有本地交易数据，请先在仪表盘导入。');
  }
  // ensure trades sorted by date ascending
  trades.sort((a,b)=> new Date(a.date)-new Date(b.date));

  /* -------- equity curve --------- */
  function calcAgg(groupFn){
    const map = {};
    trades.forEach(tr=>{
      const key = groupFn(new Date(tr.date+'T00:00:00Z'));
      const pl = (typeof tr.pl === 'number') ? tr.pl : 0;
      map[key] = (map[key]||0) + pl;
    });
    // sort keys
    const keys = Object.keys(map).sort();
    const daily = keys.map(k=>({key:k, pnl:map[k]}));
    let cumulative = 0;
    return daily.map(d=>{
      cumulative += d.pnl;
      return {...d, cumulative};
    });
  }
  const dataDaily  = calcAgg(d=>formatDate(d));
  const dataWeekly = calcAgg(weekOfYear);
  const dataMonthly= calcAgg(monthKey);

  let curMode='day';

  // ---- chart ----
  let chartInstance=null;
  function renderChart(mode){
    curMode=mode;
    const mapping = {day:dataDaily, week:dataWeekly, month:dataMonthly}[mode];
    const labels = mapping.map(d=>d.key);
    const values = mapping.map(d=>d.cumulative);
    const ctx = document.getElementById('pnlCanvas').getContext('2d');
    if(chartInstance){
      chartInstance.destroy();
    }
    chartInstance = new Chart(ctx,{
      type:'line',
      data:{
        labels,
        datasets:[{label:'累计净值 ($)',data:values,tension:0.25,fill:true}]
      },
      options:{
        responsive:true,
        scales:{
          x:{ticks:{color:'#94a3b8'}},
          y:{beginAtZero:true,ticks:{color:'#94a3b8'}}
        },
        plugins:{legend:{display:false}}
      }
    });
  }
  renderChart('day');

  // buttons
  document.getElementById('btn-day').addEventListener('click',()=>renderChart('day'));
  document.getElementById('btn-week').addEventListener('click',()=>renderChart('week'));
  document.getElementById('btn-month').addEventListener('click',()=>renderChart('month'));

  /* -------- ranking -------- */
  function renderRanking(type='profit'){
    const map={};
    trades.forEach(tr=>{
      const pl = (typeof tr.pl==='number')? tr.pl : 0;
      map[tr.symbol]=(map[tr.symbol]||0)+pl;
    });
    let arr = Object.entries(map).map(([sym,pnl])=>({sym,pnl}));
    arr.sort((a,b)=> type==='profit'? b.pnl-a.pnl : a.pnl-b.pnl);
    arr = arr.slice(0,10);
    const tbl = document.getElementById('rankTable');
    // header
    tbl.innerHTML='<tr><th>#</th><th>代码</th><th>累计盈亏($)</th></tr>';
    arr.forEach((row,i)=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${i+1}</td><td>${row.sym}</td><td style="color:${row.pnl>=0?'#4ade80':'#f87171'}">${row.pnl.toFixed(2)}</td>`;
      tbl.appendChild(tr);
    });
  }
  renderRanking('profit');

  document.getElementById('rank-profit').addEventListener('click',()=>{
    renderRanking('profit');
  });
  document.getElementById('rank-loss').addEventListener('click',()=>{
    renderRanking('loss');
  });

})();
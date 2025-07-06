
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
  document.getElementById('btn-day').addEventListener('click',()=>{activateButton('btn-day',['btn-day','btn-week','btn-month']);renderChart('day');});
  document.getElementById('btn-week').addEventListener('click',()=>{activateButton('btn-week',['btn-day','btn-week','btn-month']);renderChart('week');});
  document.getElementById('btn-month').addEventListener('click',()=>{activateButton('btn-month',['btn-day','btn-week','btn-month']);renderChart('month');});

  
function activateButton(btnId, group){
  group.forEach(id=>{
    const b=document.getElementById(id);
    if(b){
      if(id===btnId) b.classList.add('active');
      else b.classList.remove('active');
    }
  });
}
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

  document.getElementById('rank-profit').addEventListener('click',()=>{activateButton('rank-profit',['rank-profit','rank-loss']);
    renderRanking('profit');
  });
  document.getElementById('rank-loss').addEventListener('click',()=>{activateButton('rank-loss',['rank-profit','rank-loss']);
    renderRanking('loss');
  });


/* -------- calendar -------- */
function buildCalendar(){
  const calDiv = document.getElementById('tradeCalendar');
  if(!calDiv) return;
  calDiv.innerHTML='';
  // group trades by date
  const dayMap = {};
  trades.forEach(tr=>{
    const key = tr.date; // assume yyyy-mm-dd
    const pl = (typeof tr.pl==='number')? tr.pl : 0;
    dayMap[key]=(dayMap[key]||0)+pl;
  });
  const dates = Object.keys(dayMap).sort();
  if(dates.length===0){
    calDiv.innerHTML='<p style="text-align:center;color:#94a3b8">暂无数据</p>';
    return;
  }
  // figure months
  const months = [...new Set(dates.map(d=>d.slice(0,7)))];
  months.forEach(month=>{
    const monthLabel=document.createElement('h4');
    monthLabel.textContent=month;
    monthLabel.style.margin='6px 0 4px';
    calDiv.appendChild(monthLabel);

    const grid=document.createElement('div');
    grid.className='calendar-grid';
    // find first day of month
    const [y,m]=month.split('-').map(Number);
    const firstDate=new Date(y, m-1, 1);
    const firstWeekDay=firstDate.getDay(); // 0 Sunday
    // fill blanks
    for(let i=0;i<firstWeekDay;i++){
      const cell=document.createElement('div');
      cell.className='calendar-cell zero';
      grid.appendChild(cell);
    }
    // days in month
    const days=new Date(y, m, 0).getDate();
    for(let d=1; d<=days; d++){
      const dateKey = month + '-' + String(d).padStart(2,'0');
      const pnl = dayMap[dateKey]||0;
      const cell=document.createElement('div');
      cell.className='calendar-cell ' + (pnl>0?'positive': pnl<0?'negative':'zero');
      cell.innerHTML = '<div>'+d+'</div><div>'+ (pnl!==0? pnl.toFixed(0):'') +'</div>';
      grid.appendChild(cell);
    }
    calDiv.appendChild(grid);
  });
}
buildCalendar();
})();

/* -------- enhanced multi-calendar -------- */
(function(){
  const state = {
    date: new Date(),
    view: 'month' // day,week,month,year
  };
  function isSameDay(a,b){
    return a.getUTCFullYear()===b.getUTCFullYear() && a.getUTCMonth()===b.getUTCMonth() && a.getUTCDate()===b.getUTCDate();
  }
  function getTrades(){
    let trades = JSON.parse(localStorage.getItem('trades')||'[]');
    trades.sort((a,b)=> new Date(a.date)-new Date(b.date));
    return trades;
  }
  function isIntradayTrade(t){
    // Treat as intraday if openDate==closeDate or explicit flag
    if(t.intraday!==undefined) return t.intraday;
    return t.closeDate && t.date === t.closeDate;
  }
  function buildCalendar(elId, trades){
    const container = document.getElementById(elId);
    if(!container) return;
    container.innerHTML='';
    const date = state.date;
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth()+1;
    // Build day map
    const dayMap = {};
    trades.forEach(t=>{
      const dkey = t.date;
      if(!dayMap[dkey]) dayMap[dkey]=0;
      dayMap[dkey]+= (t.real || t.pnl || 0);
    });
    const grid=document.createElement('div');
    grid.className='calendar-grid';
    container.appendChild(grid);
    // blank cells until first weekday
    const firstWeekDay=new Date(Date.UTC(y, m-1,1)).getUTCDay();
    for(let i=0;i<firstWeekDay;i++){
      const cell=document.createElement('div');
      cell.className='calendar-cell zero';
      grid.appendChild(cell);
    }
    const daysInMonth=new Date(y,m,0).getUTCDate();
    for(let d=1; d<=daysInMonth; d++){
      const dateKey = y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const pnl=dayMap[dateKey]||0;
      const cell=document.createElement('div');
      cell.className='calendar-cell '+(pnl>0?'positive': pnl<0?'negative':'zero');
      cell.innerHTML='<div>'+d+'</div><div>'+ (pnl!==0? Math.round(pnl):'') +'</div>';
      grid.appendChild(cell);
    }
  }
  function renderCalendars(){
    const trades = getTrades();
    const total = trades;
    const intra = trades.filter(isIntradayTrade);
    buildCalendar('tradeCalendarTotal', total);
    buildCalendar('tradeCalendarIntraday', intra);
  }
  // controls
  document.getElementById('cal-prev')?.addEventListener('click',()=>{
    if(state.view==='month'){
      state.date.setUTCMonth(state.date.getUTCMonth()-1);
    }else if(state.view==='year'){
      state.date.setUTCFullYear(state.date.getUTCFullYear()-1);
    }
    renderCalendars();
  });
  document.getElementById('cal-next')?.addEventListener('click',()=>{
    if(state.view==='month'){
      state.date.setUTCMonth(state.date.getUTCMonth()+1);
    }else if(state.view==='year'){
      state.date.setUTCFullYear(state.date.getUTCFullYear()+1);
    }
    renderCalendars();
  });
  document.querySelectorAll('.view-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.view=btn.dataset.view;
      // For simplicity, we support day/week/month/year; but in this MVP we treat day/week same as month.
      renderCalendars();
    });
  });
  // initial
  renderCalendars();
})();


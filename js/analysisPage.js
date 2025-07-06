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

  /* ---------- v7.16 新增：资金收益曲线基于“当日已实现盈亏 + 当日浮动盈亏” ---------- */
  async function getApiKeys(){
    if(getApiKeys._cache) return getApiKeys._cache;
    const txt = await fetch('KEY.txt').then(r=>r.text());
    const m = txt.match(/Finnhub key：([\w]+)/);
    const finnhub = m? m[1] : '';
    return (getApiKeys._cache = {finnhub});
  }

  /* 获取某股票历史日线收盘价字典 {YYYY-MM-DD:close} */
  async function fetchDailyCloses(symbol, startDate, endDate, token){
    const fromTs = Math.floor(new Date(startDate+'T00:00:00Z').getTime()/1000);
    const toTs   = Math.floor(new Date(endDate  +'T23:59:59Z').getTime()/1000);
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromTs}&to=${toTs}&token=${token}`;
    const data = await fetch(url).then(r=>r.json()).catch(()=>({s:'error'}));
    if(data.s!=='ok') return {};
    const res = {};
    data.t.forEach((t,i)=>{
      const d = new Date(t*1000).toISOString().slice(0,10);
      res[d] = data.c[i];
    });
    return res;
  }

  /* 计算每日净值变化 (已实现 + 浮动) */
  async function computeDailyNet(trades){
    if(!trades || trades.length===0) return [];
    trades.sort((a,b)=> new Date(a.date)-new Date(b.date));
    const symbols=[...new Set(trades.map(t=>t.symbol))];
    const minDate = trades[0].date;
    const maxDate = trades[trades.length-1].date;
    const keys = await getApiKeys();
    const priceDict={};
    for(const sym of symbols){
      priceDict[sym] = await fetchDailyCloses(sym, minDate, maxDate, keys.finnhub);
    }
    const dateArr=[];
    for(let d=new Date(minDate+'T00:00:00Z'); d<=new Date(maxDate+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+1)){
      dateArr.push(formatDate(d));
    }
    // 持仓数量（不区分多空，BUY+/SELL-）
    const posQty={};
    const result=[];
    for(let i=0;i<dateArr.length;i++){
      const dt=dateArr[i];
      // Realized
      const dayTrades = trades.filter(t=>t.date===dt);
      let realized = dayTrades.reduce((s,t)=> s +(typeof t.pl==='number'? t.pl:0), 0);
      // Update positions
      dayTrades.forEach(t=>{
        const delta = (t.side==='BUY'||t.side==='COVER') ? t.qty : -t.qty;
        posQty[t.symbol]=(posQty[t.symbol]||0)+delta;
      });
      // Unrealized (浮动) 当日 = 当日收盘价 - 前一日收盘价
      let unrealized=0;
      for(const sym of symbols){
        const qty=posQty[sym]||0;
        if(qty===0) continue;
        const closeToday = priceDict[sym][dt];
        const prevDate = dateArr[i-1];
        const closePrev = prevDate ? priceDict[sym][prevDate] : undefined;
        if(typeof closeToday==='number' && typeof closePrev==='number'){
          unrealized += qty * (closeToday - closePrev);
        }
      }
      const net=realized+unrealized;
      result.push({date:dt, realized, unrealized, net});
    }
    // 累计曲线
    let cumulative=0;
    return result.map(d=>{
      cumulative += d.net;
      return {...d, cumulative};
    });
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

  /* (v7.10 legacy curve code removed) */
  let curMode='day';

  // ---- chart ----
  let chartInstance=null;
  let dailyData=[], weeklyData=[], monthlyData=[];

  function groupKeyWeek(d){
    return weekOfYear(new Date(d+'T00:00:00Z'));
  }
  function groupKeyMonth(d){
    const p=new Date(d+'T00:00:00Z');
    return p.getUTCFullYear()+'-'+String(p.getUTCMonth()+1).padStart(2,'0');
  }
  function aggregate(dataArr, keyFn){
    const mp={};
    dataArr.forEach(r=>{
      const k=keyFn(r.date);
      mp[k]=(mp[k]||0)+r.net;
    });
    const keys=Object.keys(mp).sort();
    let cum=0;
    return keys.map(k=>{
       cum += mp[k];
       return {key:k, cumulative:cum};
    });
  }

  async function prepareCurve(){
    dailyData = await computeDailyNet(trades);
    weeklyData = aggregate(dailyData, groupKeyWeek);
    monthlyData= aggregate(dailyData, groupKeyMonth);
    renderChart(curMode);
  }

  function renderChart(mode){
    curMode = mode;
    const mapping = {day:dailyData, week:weeklyData, month:monthlyData}[mode]||dailyData;
    const labels = mapping.map(d=>d.key || d.date);
    const values = mapping.map(d=>d.cumulative.toFixed(2));
    const ctx=document.getElementById('pnlCanvas').getContext('2d');
    if(chartInstance) chartInstance.destroy();
    chartInstance=new Chart(ctx,{
      type:'line',
      data:{labels,datasets:[{label:'累计净值($)',data:values,tension:0.25,fill:true}]},
      options:{responsive:true,plugins:{legend:{display:false}},
               scales:{x:{ticks:{color:'#94a3b8'}},y:{beginAtZero:false,ticks:{color:'#94a3b8'}}}}
    });
  }

  /* 按钮绑定 */
  ['btn-day','btn-week','btn-month'].forEach(id=>{
    const btn=document.getElementById(id);
    if(btn){
      btn.addEventListener('click',()=>{
        ['btn-day','btn-week','btn-month'].forEach(other=>document.getElementById(other)?.classList.remove('active'));
        btn.classList.add('active');
        renderChart(id==='btn-day'?'day': id==='btn-week'?'week':'month');
      });
    }
  });

  /* ---------- 加载曲线 ---------- */
  prepareCurve();

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
      /* v7.16 日历新增：week header + 日期标注 + 支持 state.view=day */
      let dayMap={};
      const isDailyArr = Array.isArray(trades) && trades.length && trades[0].date && typeof trades[0].net==='number';
      if(isDailyArr){
        trades.forEach(rec=>{
          dayMap[rec.date]=rec.net;
        });
      }else{
        // legacy fallback
        trades.forEach(t=>{
          const dkey = t.date;
          const val = (typeof t.net==='number')? t.net :(typeof t.pl==='number'? t.pl:0);
          dayMap[dkey]=(dayMap[dkey]||0)+val;
        });
      }

      const container = document.getElementById(elId);
      if(!container) return;
      container.innerHTML='';
      const date = state.date;
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth()+1;

      // ***删除了重复声明 dayMap 的代码，只保留上面构造部分***

      // 添加星期栏
      const headerRow=document.createElement('div');
      headerRow.className='calendar-header';
      const wdLabels=['日','一','二','三','四','五','六'];
      wdLabels.forEach(l=>{
        const h=document.createElement('div');
        h.textContent='周'+l;
        headerRow.appendChild(h);
      });
      container.appendChild(headerRow);
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
      if(!dailyData || dailyData.length===0) return;
      buildCalendar('tradeCalendarTotal', dailyData);
      computeDailyNet(trades.filter(isIntradayTrade)).then(intra=>{
          buildCalendar('tradeCalendarIntraday',intra);
      });
    }
    // controls
    document.getElementById('cal-prev')?.addEventListener('click',()=>{
      if(state.view==='day'){
        state.date.setUTCDate(state.date.getUTCDate()-1);
      }else if(state.view==='week'){
        state.date.setUTCDate(state.date.getUTCDate()-7);
      }else if(state.view==='month'){
        state.date.setUTCMonth(state.date.getUTCMonth()-1);
      }else if(state.view==='year'){
        state.date.setUTCFullYear(state.date.getUTCFullYear()-1);
      }
      renderCalendars();
    });

    document.getElementById('cal-next')?.addEventListener('click',()=>{
      if(state.view==='day'){ state.date.setUTCDate(state.date.getUTCDate()-1); }
      else if(state.view==='month'){
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
})();

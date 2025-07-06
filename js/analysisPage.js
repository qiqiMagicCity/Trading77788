
/* Trading777 v7.12 – 分析页脚本
   更新:
   1. 交易日历新增 日/周/月/年 视图, 上下翻页 & 时间标签
   2. 总账户日历使用 equity_curve 数据; 视图聚合后求和
   3. 日历单元带 $ 前缀, 正负盈亏背景分别 green/red
*/

(function(){
  // --- DOM helpers fallback (避免 $$ 未定义导致脚本异常) ---
  const $  = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));


  /* ---------- 常量 & 状态 ---------- */
  const STORAGE_KEY_EQUITY='equity_curve';
  const state = {
    date: new Date(),      // 当前锚点日期 (根据 view 不同解释)
    view: 'month'          // day | week | month | year
  };

  /* ---------- 工具函数 ---------- */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const pad = n => String(n).padStart(2,'0');

  function loadCurve(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY_EQUITY)||'[]');
    }catch(e){return [];}
  }
  function loadTrades(){
    try{
      return JSON.parse(localStorage.getItem('trades')||'[]');
    }catch(e){return [];}
  }

  function fmtDate(d){ return d.toISOString().slice(0,10); }

  /* ---------- 数据源 ---------- */
  // 总账户 – 来自 equity_curve
  const equityDaily = loadCurve().map(pt=>({date:pt.date,pnl:Number(pt.value||0)}));
  // intraday – 从 trades 过滤 open+close 同日的交易
  const tradesAll = loadTrades();
  const intradayDaily = (() => {
       const dayMap={};
       tradesAll.forEach(t=>{
         if(!t.date) return;
         const key=t.date;
         const pl=Number(t.pl||0);
         dayMap[key]=(dayMap[key]||0)+pl;
       });
       return Object.entries(dayMap).map(([date,pnl])=>({date,pnl}));
  })();

  /* ---------- 视图窗口计算 ---------- */
  function getPeriodRange(date,view){
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    if(view==='day'){
      return {start:d, end:new Date(d.getTime()+86400000)};
    }
    if(view==='week'){
      const dow = d.getUTCDay(); // 0=Sun
      const start = new Date(d.getTime() - dow*86400000);
      return {start, end:new Date(start.getTime()+7*86400000)};
    }
    if(view==='month'){
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(),1));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1,1));
      return {start,end};
    }
    // year
    const start = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const end = new Date(Date.UTC(d.getUTCFullYear()+1,0,1));
    return {start,end};
  }

  function dateKeyDay(ts){
     return ts.toISOString().slice(0,10);
  }

  /* ---------- 日历渲染 ---------- */
  function renderCalendar(containerId, dailyData){
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML='';

    const {start,end} = getPeriodRange(state.date, state.view);
    const msDay = 86400000;
    const dayCount = Math.round((end-start)/msDay);

    // Build aggregate map for chosen view granularity
    let cells=[];
    if(state.view==='day'){
       // 1 个方块
       const dkey = dateKeyDay(start);
       const pnl = dailyData.find(p=>p.date===dkey)?.pnl || 0;
       cells = [{label:dkey,pnl}];
    }else if(state.view==='week' || state.view==='month'){
       for(let i=0;i<dayCount;i++){
          const cur = new Date(start.getTime()+i*msDay);
          const key = dateKeyDay(cur);
          const pnl = dailyData.find(p=>p.date===key)?.pnl || 0;
          cells.push({label:cur.getUTCDate(),pnl});
       }
    }else if(state.view==='year'){
       // aggregate each month
       for(let m=0;m<12;m++){
          const mStart = new Date(Date.UTC(start.getUTCFullYear(),m,1));
          const mEnd = new Date(Date.UTC(start.getUTCFullYear(),m+1,1));
          const sum = dailyData.reduce((s,p)=>{
              const pd = new Date(p.date+'T00:00:00Z');
              return (pd>=mStart && pd<mEnd)? s+p.pnl : s;
          },0);
          cells.push({label:String(m+1)+'月',pnl:sum});
       }
    }

    // Decide grid config
    let gridCols=7;
    if(state.view==='year') gridCols=4;
    if(state.view==='day') gridCols=1;

    const grid = document.createElement('div');
    grid.className='calendar-grid';
    grid.style.gridTemplateColumns=`repeat(${gridCols}, minmax(120px,1fr))`;
    container.appendChild(grid);

    cells.forEach(c=>{
       const cell=document.createElement('div');
       cell.className='calendar-cell';
       let bg='#013939';
       if(c.pnl>0) bg='rgba(0,128,0,0.5)';
       if(c.pnl<0) bg='rgba(128,0,0,0.5)';
       cell.style.background=bg;
       cell.innerHTML=`<div style="font-size:0.9rem;">${c.label}</div><div style="margin-top:4px;">${c.pnl===0?'':('$'+c.pnl)}</div>`;
       grid.appendChild(cell);
    });
  }

  /* ---------- 控件处理 ---------- */
  function updateLabel(){
    const lbl = $('#cal-label');
    if(!lbl) return;
    if(state.view==='day'){
       lbl.textContent = fmtDate(state.date);
    }else if(state.view==='week'){
       const {start,end} = getPeriodRange(state.date,'week');
       lbl.textContent = fmtDate(start)+' ~ '+fmtDate(new Date(end.getTime()-86400000));
    }else if(state.view==='month'){
       lbl.textContent = state.date.getUTCFullYear() + '-' + pad(state.date.getUTCMonth()+1);
    }else{
       lbl.textContent = state.date.getUTCFullYear();
    }
  }

  function renderAll(){
    renderCalendar('tradeCalendarTotal', equityDaily);
    renderCalendar('tradeCalendarIntraday', intradayDaily);
    updateLabel();
  }

  // prev / next buttons
  $('#cal-prev')?.addEventListener('click',()=>{
      if(state.view==='day') state.date.setUTCDate(state.date.getUTCDate()-1);
      else if(state.view==='week') state.date.setUTCDate(state.date.getUTCDate()-7);
      else if(state.view==='month') state.date.setUTCMonth(state.date.getUTCMonth()-1);
      else if(state.view==='year') state.date.setUTCFullYear(state.date.getUTCFullYear()-1);
      renderAll();
  });
  $('#cal-next')?.addEventListener('click',()=>{
      if(state.view==='day') state.date.setUTCDate(state.date.getUTCDate()+1);
      else if(state.view==='week') state.date.setUTCDate(state.date.getUTCDate()+7);
      else if(state.view==='month') state.date.setUTCMonth(state.date.getUTCMonth()+1);
      else if(state.view==='year') state.date.setUTCFullYear(state.date.getUTCFullYear()+1);
      renderAll();
  });

  $$('.view-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
          $$('.view-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          state.view = btn.dataset.view;
          renderAll();
      });
  });

  // 初始渲染
  renderAll();

})();

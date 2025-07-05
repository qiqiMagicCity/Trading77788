/* Trading777 Analysis script v7.7.9 */
(function(){
  // helper
  function $(sel){return document.querySelector(sel);}
  // fetch trades
  let trades = JSON.parse(localStorage.getItem('trades')||'[]');
  trades.sort((a,b)=> new Date(a.date)-new Date(b.date));
  // FIFO adjust if lib present
  if(window.FIFO && typeof window.FIFO.computeFIFO==='function'){
     trades = window.FIFO.computeFIFO(trades);
  }

  // ------ STAT PANELS -------
  const panels = [
    {id:'totalPnL', label:'累计盈亏', value:0, fmt:v=>v.toFixed(2)},
    {id:'currentValue', label:'当前市值', value:0, fmt:v=>v.toFixed(2)},
    {id:'winRate', label:'胜率', value:0, fmt:v=> (v*100).toFixed(1)+'%'},
    {id:'avgWL', label:'平均盈亏比', value:0, fmt:v=>v.toFixed(2)},
    {id:'wtd', label:'WTD', value:0, fmt:v=>v.toFixed(2)},
    {id:'mtd', label:'MTD', value:0, fmt:v=>v.toFixed(2)},
    {id:'ytd', label:'YTD', value:0, fmt:v=>v.toFixed(2)},
    {id:'maxWin', label:'最大单笔盈利', value:0, fmt:v=>v.toFixed(2)},
    {id:'maxLoss', label:'最大单笔亏损', value:0, fmt:v=>v.toFixed(2')}
  ];

  // calc basics
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay()+6)%7)); // Monday this week
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(),1);
  const firstDayYear = new Date(now.getFullYear(),0,1);

  let wins=0, losses=0, winAmt=0, lossAmt=0;
  trades.forEach(t=>{
     const pl = Number(t.pl||0);
     panels[0].value += pl;
     if(pl>0){wins++; winAmt+=pl;}
     else if(pl<0){losses++; lossAmt+=Math.abs(pl);}
     // weekly/monthly/yearly
     const d=new Date(t.date);
     if(d>=monday) panels[4].value += pl;
     if(d>=firstDayMonth) panels[5].value += pl;
     if(d>=firstDayYear) panels[6].value += pl;
     // max win/loss
     if(pl>panels[7].value) panels[7].value = pl;
     if(pl<panels[8].value) panels[8].value = pl;
  });

  panels[2].value = (wins+losses)>0 ? wins/(wins+losses):0;
  panels[3].value = lossAmt>0 ? (winAmt/wins)/(lossAmt/losses):0;

  // Render panels
  const statBox = id=>`<div class="bg-white p-4 rounded shadow text-center">
    <div class="text-xs text-gray-500 mb-1">${id.label}</div>
    <div class="text-lg font-semibold ${id.value>0?'text-green-600':id.value<0?'text-red-600':''}">${id.fmt(id.value)}</div>
  </div>`;
  $('#stat-panels').innerHTML = panels.map(statBox).join('');

  // ------ PnL curve ------
  const granSel = $('#curve-granularity');
  const modeSel = $('#curve-mode');
  const ctx = document.getElementById('pnlChart').getContext('2d');
  let chart=null;
  function buildCurve(){
      const gran = granSel.value;
      const mode = modeSel.value;
      const buckets = {};
      trades.forEach(t=>{
        const d=new Date(t.date);
        let key='';
        if(gran==='day'){key = d.toISOString().slice(0,10);}
        else if(gran==='week'){
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate()-((d.getDay()+6)%7));
          key=weekStart.toISOString().slice(0,10);
        } else {
          key = d.getFullYear()+'-'+(d.getMonth()+1);
        }
        if(!buckets[key]) buckets[key] = {pl:0, cost:0};
        buckets[key].pl += Number(t.pl||0);
        buckets[key].cost += Number(t.amount||0);
      });
      const labels = Object.keys(buckets).sort();
      const data = labels.map(k=>{
        const b=buckets[k];
        return mode==='abs'? b.pl : (b.cost!==0? b.pl/b.cost*100:0);
      });
      if(chart) chart.destroy();
      chart = new Chart(ctx,{
        type:'line',
        data:{labels,datasets:[{data,fill:false,borderWidth:2}]},
        options:{responsive:true,plugins:{legend:{display:false}}}
      });
  }
  granSel.onchange=buildCurve;
  modeSel.onchange=buildCurve;
  buildCurve();

  // ------ Calendar -------
  const calEl = document.getElementById('calendar');
  const calModeSel = $('#calendar-mode');
  const cal = new FullCalendar.Calendar(calEl,{
     initialView:'dayGridMonth',
     height: 'auto',
     events: trades.map(t=>{
       return {title:(calModeSel.value==='abs'?t.pl.toFixed(2): ((t.pl/(t.amount||1))*100).toFixed(2)+'%'),
               start:t.date,
               color: t.pl>0?'#16a34a': t.pl<0?'#dc2626':'#9ca3af',
               display:'block'};
     })
  });
  cal.render();
  calModeSel.onchange=()=>{cal.removeAllEvents(); cal.addEventSource(trades.map(t=>{
      return {title:(calModeSel.value==='abs'?t.pl.toFixed(2): ((t.pl/(t.amount||1))*100).toFixed(2)+'%'),
              start:t.date,
              color: t.pl>0?'#16a34a': t.pl<0?'#dc2626':'#9ca3af',
              display:'block'};
  })); };

  // ------ Rank table -------
  const symbolsMap = {};
  fetch('data/symbol_name_map.json').then(r=>r.json()).then(map=>{
     Object.assign(symbolsMap,map);
     buildRank();
  });
  function buildRank(){
    const acc = {};
    trades.forEach(t=>{
       if(!acc[t.symbol]) acc[t.symbol]={logo:`logos/${t.symbol}.png`, code:t.symbol, pl:0};
       acc[t.symbol].pl += Number(t.pl||0);
    });
    const arr = Object.values(acc).sort((a,b)=>b.pl-a.pl);
    const tbody = document.querySelector('#rank-table tbody');
    tbody.innerHTML = arr.map((r,i)=>`<tr class="border-b">
      <td class="px-2 py-1">${i+1}</td>
      <td class="px-2 py-1"><img src="${r.logo}" alt="" class="w-6 h-6 object-contain"/></td>
      <td class="px-2 py-1">${r.code}</td>
      <td class="px-2 py-1">${symbolsMap[r.code]||''}</td>
      <td class="px-2 py-1 ${r.pl>0?'text-green-600':r.pl<0?'text-red-600':''}">${r.pl.toFixed(2)}</td>
    </tr>`).join('');
  }

  // ------ Pie chart -------
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  const pieData = {};
  trades.forEach(t=>{
     pieData[t.symbol]=(pieData[t.symbol]||0)+Number(t.amount||0);
  });
  const pieLabels = Object.keys(pieData);
  const pieValues = pieLabels.map(k=>pieData[k]);
  new Chart(pieCtx,{
    type:'pie',
    data:{labels:pieLabels,datasets:[{data:pieValues}]},
    options:{plugins:{legend:{position:'bottom'}}}
  });

})();
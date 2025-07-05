/* Trading777 Analysis script v7.7.10 */
(async function(){
  // helper
  function $(sel){return document.querySelector(sel);}

  // fetch trades from JSON or fallback to localStorage
  let trades = [];
  try {
    trades = await fetch('data/trades.json').then(r=>r.ok?r.json():[]);
  } catch(e){
    console.error('fetch trades.json failed', e);
  }
  if(!trades.length){
     trades = JSON.parse(localStorage.getItem('trades')||'[]');
  }

  trades.sort((a,b)=> new Date(a.date)-new Date(b.date));
  // FIFO adjust if lib present
  if(window.FIFO && typeof window.FIFO.computeFIFO==='function'){
     trades = window.FIFO.computeFIFO(trades);
  }

  // ------ STAT PANELS -------
  const panels = [
    {id:'totalPnL', label:'累计盈亏', value:0, fmt:v=>v.toFixed(2)},
    {id:'currentValue', label:'当前市值', value:0, fmt:v=>v.toFixed(2)},
    {id:'winRate', label:'胜率', value:0, fmt:v=>(v*100).toFixed(1)+'%'},
    {id:'avgRR', label:'平均盈亏比', value:0, fmt:v=>v.toFixed(2)},
    {id:'wtd', label:'WTD', value:0, fmt:v=>v.toFixed(2)},
    {id:'mtd', label:'MTD', value:0, fmt:v=>v.toFixed(2)},
    {id:'ytd', label:'YTD', value:0, fmt:v=>v.toFixed(2)},
    {id:'maxGain', label:'最大盈利', value:0, fmt:v=>v.toFixed(2)},
    {id:'maxLoss', label:'最大亏损', value:0, fmt:v=>v.toFixed(2)},
    {id:'posCount', label:'当前持仓数', value:0, fmt:v=>v},
  ];

  let wins=0, losses=0, winAmt=0, lossAmt=0;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay()+6)%7)); // Monday
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  trades.forEach(t=>{
     const pnl = Number(t.pl||0);
     panels[0].value += pnl;
     if(pnl>0){wins++; winAmt+=pnl;} else if(pnl<0){losses++; lossAmt+=Math.abs(pnl);}

     // WTD / MTD / YTD
     const d = new Date(t.date);
     if(d>=weekStart) panels[4].value += pnl;
     if(d>=monthStart) panels[5].value += pnl;
     if(d>=yearStart) panels[6].value += pnl;

     // max gain / loss
     panels[7].value = Math.max(panels[7].value, pnl);
     panels[8].value = Math.min(panels[8].value, pnl);
  });

  panels[2].value = (wins+losses)>0 ? wins/(wins+losses) : 0;
  panels[3].value = lossAmt>0 ? (winAmt/wins)/(lossAmt/losses) : 0;
  panels[9].value = [...new Set(trades.filter(t=>t.side==='BUY').map(t=>t.symbol))].length;

  // Render panels
  const statBox = p=>\`<div class="bg-white p-4 rounded shadow text-center">
    <div class="text-xs text-gray-500 mb-1">\${p.label}</div>
    <div class="text-lg font-semibold \${p.value>0?'text-green-600':p.value<0?'text-red-600':''}">\${p.fmt(p.value)}</div>
  </div>\`;
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

      const keyOf = d=>{
        const dt = new Date(d);
        if(gran==='day') return dt.toISOString().slice(0,10);
        if(gran==='week'){ const w = new Date(dt); w.setDate(w.getDate()-w.getDay()+1); return w.toISOString().slice(0,10); }
        if(gran==='month') return dt.getFullYear()+'-'+(dt.getMonth()+1).toString().padStart(2,'0');
      };

      trades.forEach(t=>{
        const key = keyOf(t.date);
        if(!buckets[key]) buckets[key]={pl:0, cost:0};
        buckets[key].pl += Number(t.pl||0);
        buckets[key].cost += Number(t.amount||0);
      });

      const labels = Object.keys(buckets).sort();
      const data = labels.map(k=> mode==='abs'? buckets[k].pl : (buckets[k].cost!==0? buckets[k].pl/buckets[k].cost*100:0));

      if(chart){ chart.destroy(); }
      chart = new Chart(ctx,{
         type:'line',
         data:{labels,datasets:[{label:'账户表现',data,fill:false}]},
         options:{plugins:{legend:{display:false}}}
      });
  }
  granSel.onchange = modeSel.onchange = buildCurve;
  buildCurve();

  // ------ Calendar heatmap ------
  const calEl = document.getElementById('calendar');
  const calModeSel = $('#cal-mode');
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
  calModeSel.onchange=()=>{
      cal.removeAllEvents();
      cal.addEventSource(trades.map(t=>{
          return {title:(calModeSel.value==='abs'?t.pl.toFixed(2): ((t.pl/(t.amount||1))*100).toFixed(2)+'%'),
                  start:t.date,
                  color: t.pl>0?'#16a34a': t.pl<0?'#dc2626':'#9ca3af',
                  display:'block'};
      }));
  };

  // ------ Rank table -------
  const symbolsMap = {};
  fetch('data/symbol_name_map.json').then(r=>r.json()).then(map=>{
     Object.assign(symbolsMap,map);
     buildRank();
  });
  function buildRank(){
    const acc = {};
    trades.forEach(t=>{
       if(!acc[t.symbol]) acc[t.symbol]={logo:\`logos/\${t.symbol}.png\`, code:t.symbol, pl:0};
       acc[t.symbol].pl += Number(t.pl||0);
    });
    const arr = Object.values(acc).sort((a,b)=>b.pl-a.pl);
    const tbody = document.querySelector('#rank-table tbody');
    tbody.innerHTML = arr.map((r,i)=>\`<tr class="border-b">
      <td class="px-2 py-1">\${i+1}</td>
      <td class="px-2 py-1"><img src="\${r.logo}" alt="" class="w-6 h-6 object-contain"/></td>
      <td class="px-2 py-1">\${r.code}</td>
      <td class="px-2 py-1">\${symbolsMap[r.code]||''}</td>
      <td class="px-2 py-1 \${r.pl>0?'text-green-600':r.pl<0?'text-red-600':''}">\${r.pl.toFixed(2)}</td>
    </tr>\`).join('');
  }

  // ------ Pie chart -------
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  const pieData = {};
  trades.forEach(t=>{
     pieData[t.symbol]=(pieData[t.symbol]||0)+Number(t.amount||0);
  });
  const pieLabels = Object.keys(pieData);
  const pieValues = pieLabels.map(k=>pieData[k]);
  const pieChart = new Chart(pieCtx,{
    type:'pie',
    data:{labels:pieLabels,datasets:[{data:pieValues}]},
    options:{
       plugins:{legend:{position:'bottom'}},
       onClick:(evt, elements)=>{
         if(elements.length){
            const idx = elements[0].index;
            const sym = pieLabels[idx];
            window.location.href = \`stock.html?symbol=\${sym}\`;
         }
       }
    }
  });

})();
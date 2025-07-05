
/* Trading777 Analysis script v7.7.6 */
(function() {
// --- Config ---
const BASE_VALUE = 100; // for percent calcs

// --- Utils ---
function numberColor(v) {
  if(v>0) return 'green';
  if(v<0) return 'red';
  return 'white';
}
function fmtPnL(v) {
  return isFinite(v)? (v>0?'+':'')+v.toFixed(2):'';
}

// --- Data load ---
const trades = JSON.parse(localStorage.getItem('trades')||'[]');

// fallback if no trades
if(!Array.isArray(trades) || trades.length===0){
   console.warn('No trades found in localStorage');
}

// Build daily absolute PnL map
const dailyAbs = {};
trades.forEach(t=>{
    const d = t.date.slice(0,10);
    const pl = Number(t.pl||0);
    dailyAbs[d]=(dailyAbs[d]||0)+pl;
});
const allDates = Object.keys(dailyAbs).sort();

// Build daily cumulative & pct maps
let cum = 0;
const dailyCum = {};
const dailyPct = {};
allDates.forEach((d,idx)=>{
    const pl = dailyAbs[d];
    cum += pl;
    dailyCum[d]=cum;
    const base = BASE_VALUE + (idx? dailyCum[allDates[idx-1]]:0);
    dailyPct[d] = base? (pl/base*100):0;
});

// Helper to aggregate to week/month
function getWeekKey(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay()===0?7:date.getDay(); // Monday=1
    const monday = new Date(date);
    monday.setDate(date.getDate() - day +1);
    return monday.toISOString().slice(0,10); // Monday date
}

function aggregate(map, mode) {
    const out = {};
    Object.keys(map).forEach(d=>{
        let key;
        if(mode==='day') key=d;
        else if(mode==='week') key=getWeekKey(d);
        else if(mode==='month') key=d.slice(0,7);
        out[key]=(out[key]||0)+map[d];
    });
    const sortedKeys = Object.keys(out).sort();
    return sortedKeys.map(k=>[k,out[k]]);
}

// --- Chart ---
const ctx = document.getElementById('pnlChart').getContext('2d');
let chart;
let timeframe='day';
function buildDataset(absOrPct){
    const src = absOrPct==='abs'? dailyAbs : dailyPct;
    const agg = aggregate(src,timeframe);
    const labels = agg.map(i=>i[0]);
    let cum=0;
    const data = agg.map(i=> {
        cum += i[1];
        return cum.toFixed(2);
    });
    return {labels,data};
}

function renderChart(absOrPct='abs'){
    const dset = buildDataset(absOrPct);
    const labels = dset.labels;
    const data = dset.data;
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type:'line',
        data: {
            labels: labels,
            datasets:[{
                data: data,
                tension:0.3,
                pointRadius:0,
                borderWidth:2
            }]
        },
        options:{
            responsive:true,
            scales:{
                x:{grid:{display:false}},
                y:{grid:{color:'#334155'},ticks:{callback:(v)=>absOrPct==='abs'?v:v+'%'}}
            },
            plugins:{
               legend:{display:false},
               tooltip:{callbacks:{label:(context)=>absOrPct==='abs'? ' '+context.parsed.y: ' '+context.parsed.y+'%'}}
            }
        }
    });
}

// Initial chart
let mode='abs'; // abs vs pct for chart + calendar
renderChart(mode);

// --- Timeframe buttons ---
document.getElementById('tfDay').onclick=()=>{timeframe='day';setTfActive('tfDay');renderChart(mode);} };
document.getElementById('tfWeek').onclick=()=>{timeframe='week';setTfActive('tfWeek');renderChart(mode);} };
document.getElementById('tfMonth').onclick=()=>{timeframe='month';setTfActive('tfMonth');renderChart(mode);} };
function setTfActive(id){
   ['tfDay','tfWeek','tfMonth'].forEach(btn=>document.getElementById(btn).classList.replace('bg-blue-500','bg-slate-700'));
   const el=document.getElementById(id);
   el.classList.replace('bg-slate-700','bg-blue-500');
}

// --- Calendar ---
const calendarEl = document.getElementById('calendar');
let calendar;
function buildCalendarEvents(){
    return allDates.map(d=>{
        const value = mode==='abs'? dailyAbs[d]: dailyPct[d];
        return {
            title: mode==='abs'? fmtPnL(value): value.toFixed(2)+'%',
            start: d,
            color: value>=0? '#22c55e':'#ef4444'
        };
    });
}
function renderCalendar(){
    if(calendar) calendar.destroy();
    calendar = new FullCalendar.Calendar(calendarEl,{
        initialView:'dayGridMonth',
        height:'auto',
        events: buildCalendarEvents(),
        dayMaxEvents:true
    });
    calendar.render();
}
renderCalendar();

// Calendar toggle buttons
document.getElementById('toggleAbs').onclick=()=>{mode='abs'; setCalBtn('toggleAbs'); renderCalendar(); renderChart(mode);};
document.getElementById('togglePct').onclick=()=>{mode='pct'; setCalBtn('togglePct'); renderCalendar(); renderChart(mode);};
function setCalBtn(id){
    ['toggleAbs','togglePct'].forEach(btn=>document.getElementById(btn).classList.replace('bg-blue-500','bg-slate-700'));
    const el=document.getElementById(id);
    el.classList.replace('bg-slate-700','bg-blue-500');
}

// --- Ranking ---
function renderRanking(tab='profit') {
    const symPnl = {};
    trades.forEach(t=> {
        const pnl = Number(t.pl||0);
        symPnl[t.symbol]=(symPnl[t.symbol]||0)+pnl;
    });
    const list = Object.entries(symPnl)
        .filter(([s,v])=> tab==='profit'? v>0:v<0)
        .sort((a,b)=> tab==='profit'? b[1]-a[1]: a[1]-b[1])
        .slice(0,10);

    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML='';
    list.forEach(([sym,pnl],i)=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`
          <td class="py-1 px-2">${i+1}</td>
          <td class="py-1 px-2"><img src="logos/${sym}.png" onerror="this.style.display='none'" class="w-5 h-5 inline-block"/></td>
          <td class="py-1 px-2">${sym}</td>
          <td class="py-1 px-2">${window.SymbolCN?.[sym]||''}</td>
          <td class="py-1 px-2 ${pnl>0?'green':'red'}">${fmtPnL(pnl)}</td>
        `;
        tbody.appendChild(tr);
    });
}
renderRanking('profit');
document.getElementById('tab-profit').onclick=()=>{
    document.getElementById('tab-profit').classList.add('active');
    document.getElementById('tab-loss').classList.remove('active');
    renderRanking('profit');
};
document.getElementById('tab-loss').onclick=()=>{
    document.getElementById('tab-loss').classList.add('active');
    document.getElementById('tab-profit').classList.remove('active');
    renderRanking('loss');
};
})();

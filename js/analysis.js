
/* Trading777 交易分析 – v7.7.3 */
(function(){
/* ---------- utilities ---------- */
function numberColor(v){
  if(v>0) return 'green';
  if(v<0) return 'red';
  return 'white';
}
function formatPnL(v){ return (isFinite(v)? v.toFixed(2):''); }

/* ---------- clock ---------- */
function renderClocks(){
  const fmt = tz => new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour12:false});
  document.getElementById('clocks').innerHTML =
      `纽约：${fmt('America/New_York')} | 瓦伦西亚：${fmt('Europe/Madrid')} | 上海：${fmt('Asia/Shanghai')}`;
}
renderClocks();
setInterval(renderClocks,1000*30);

/* ---------- load trades ---------- */
let trades = JSON.parse(localStorage.getItem('trades')||'[]');
trades.forEach(t=>{ t.date = t.date||t.time||t.datetime; });
trades = trades.filter(t=>t.date && isFinite(t.pl));

/* ---------- build daily pnl map ---------- */
const dailyMap = {};
trades.forEach(t=>{
  const d = t.date.slice(0,10);
  const pl = Number(t.pl)||0;
  dailyMap[d] = (dailyMap[d]||0)+pl;
});
const allDates = Object.keys(dailyMap).sort();

/* ---------- line chart (cumulative) ---------- */
let cum = 0, lineData=[], lastDate='';
allDates.forEach(d=>{
   const v = dailyMap[d];
   cum += v;
   lineData.push([d,cum.toFixed(2)]);
   lastDate=d;
});
const lineChart = echarts.init(document.getElementById('profit-line'));
lineChart.setOption({
  tooltip:{trigger:'axis'},
  xAxis:{type:'category',data:lineData.map(i=>i[0])},
  yAxis:{type:'value'},
  series:[{type:'line',smooth:true,data:lineData.map(i=>i[1])}]
});

/* ---------- calendar ---------- */
const calendarWrap = document.getElementById('calendar-wrap');
let curYearMonth = lastDate? lastDate.slice(0,7): (new Date()).toISOString().slice(0,7);
function renderCalendar(ym){
   const [y,m] = ym.split('-').map(n=>parseInt(n,10));
   const first=new Date(y,m-1,1);
   const last=new Date(y,m,0);
   const startDow = (first.getDay()+6)%7; // Monday=0
   const weeks=Math.ceil((startDow+last.getDate())/7);
   let html='<table class="calendar"><thead><tr>';
   ['一','二','三','四','五','六','日'].forEach(d=>{html+=`<th>${d}</th>`});
   html+='</tr></thead><tbody>';
   let day=1;
   for(let w=0;w<weeks;w++){
      html+='<tr>';
      for(let dow=0;dow<7;dow++){
         const cellIndex=w*7+dow;
         const dateStr=day<=last.getDate()? `${ym}-${String(day).padStart(2,'0')}`:'';
         if(cellIndex<startDow || day>last.getDate()){
            html+='<td></td>';
         }else{
            const pnl=dailyMap[dateStr]||0;
            const cls = numberColor(pnl);
            html+=`<td class="${cls}"><span class="day">${day}</span><span class="pnl">${formatPnL(pnl)}</span></td>`;
            day++;
         }
      }
      html+='</tr>';
   }
   html+='</tbody></table>';
   calendarWrap.innerHTML=html;
   document.getElementById('cur-month').textContent = ym;
}
renderCalendar(curYearMonth);

document.getElementById('prev-month').onclick = ()=>{
  const [y,m]=curYearMonth.split('-').map(Number);
  const date = new Date(y,m-2,1);
  curYearMonth = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  renderCalendar(curYearMonth);
};
document.getElementById('next-month').onclick = ()=>{
  const [y,m]=curYearMonth.split('-').map(Number);
  const date = new Date(y,m,1);
  curYearMonth = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  renderCalendar(curYearMonth);
};

/* ---------- leaderboard ---------- */
const symMap={};
trades.forEach(t=>{
  symMap[t.symbol]= (symMap[t.symbol]||0) + Number(t.pl||0);
});
function sortAndSlice(arr,desc){
  return arr.sort((a,b)=> desc? b[1]-a[1]: a[1]-b[1]).slice(0,10);
}
const profitList = sortAndSlice(Object.entries(symMap).filter(([s,v])=>v>0),true);
const lossList   = sortAndSlice(Object.entries(symMap).filter(([s,v])=>v<0),false);
const tbl = document.getElementById('leaderboard');
function renderBoard(list){
   tbl.innerHTML='<tr><th>#</th><th>代码</th><th>中文</th><th>累计盈亏</th></tr>';
   list.forEach((item,i)=>{
       const [sym,pl]=item;
       const cn = window.SymbolCN && window.SymbolCN[sym]||'';
       const cls = numberColor(pl);
       tbl.insertAdjacentHTML('beforeend',`<tr>
          <td>${i+1}</td><td>${sym}</td><td class="cn">${cn}</td><td class="${cls}">${formatPnL(pl)}</td>
       </tr>`);
   });
}
renderBoard(profitList);
document.getElementById('tab-profit').onclick=()=>{
  document.getElementById('tab-profit').classList.add('active');
  document.getElementById('tab-loss').classList.remove('active');
  renderBoard(profitList);
};
document.getElementById('tab-loss').onclick=()=>{
  document.getElementById('tab-loss').classList.add('active');
  document.getElementById('tab-profit').classList.remove('active');
  renderBoard(lossList);
};
})();
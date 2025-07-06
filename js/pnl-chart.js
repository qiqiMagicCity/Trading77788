/* Trading777 – pnl-chart v7.7.22
 * Renders the '资金收益曲线' (Equity curve) for total account balances.
 * Requires Chart.js and waits for CalendarsReady event produced by analysis.js.
 * Aggregation granularity: day / week / month
 */
document.addEventListener('DOMContentLoaded', () => {
  const ctxEl = document.getElementById('pnlChart');
  if(!ctxEl) return;
  const ctx = ctxEl.getContext('2d');
  let chartInstance = null;

  function isoWeek(date){
     const tmp = new Date(date.getTime());
     tmp.setHours(0,0,0,0);
     tmp.setDate(tmp.getDate() + 4 - (tmp.getDay()||7));
     const yearStart = new Date(tmp.getFullYear(),0,1);
     const weekNo = Math.floor(((tmp - yearStart) / 86400000 + 1)/7) + 1;
     return `${tmp.getFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  function monthKey(date){
     return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  }

  function buildSeries(gran){
     const total = window.Calendars?.total || {};
     const entries = Object.entries(total).sort((a,b)=> new Date(a[0]) - new Date(b[0]));
     let labels=[], values=[];
     let cumulative=0;
     if(!entries.length) return {labels,values};

     if(gran==='day'){
        entries.forEach(([d,val])=>{
           cumulative += val;
           labels.push(d);
           values.push(Number(cumulative.toFixed(2)));
        });
     }else{
        let currentKey=null, bucketSum=0;
        const keyFn = gran==='week'? (dObj)=> isoWeek(dObj) : (dObj)=> monthKey(dObj);
        entries.forEach(([dStr,val],idx)=>{
           const dObj = new Date(dStr);
           const key = keyFn(dObj);
           if(currentKey===null) currentKey=key;
           if(key!==currentKey){
              cumulative += bucketSum;
              labels.push(currentKey);
              values.push(Number(cumulative.toFixed(2)));
              currentKey = key;
              bucketSum = 0;
           }
           bucketSum += val;
           // push last bucket
           if(idx===entries.length-1){
              cumulative += bucketSum;
              labels.push(currentKey);
              values.push(Number(cumulative.toFixed(2)));
           }
        });
     }
     return {labels,values};
  }

  function render(gran){
     const {labels,values} = buildSeries(gran);
     if(!chartInstance){
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
               label:'累计净值 ($)',
               data: values,
               tension: 0.15,
               borderWidth: 2,
               pointRadius: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                grid: { color:'rgba(255,255,255,0.05)'},
                ticks: { callback:v=>v.toLocaleString() }
              },
              x: {
                grid: { display:false }
              }
            },
            plugins:{
              tooltip:{ callbacks:{ label: (ctx)=>`$${ctx.parsed.y.toLocaleString()}` } }
            }
          }
        });
     }else{
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = values;
        chartInstance.update();
     }
  }

  // Granularity buttons
  const granButtons = document.querySelectorAll('button[data-gran]');
  granButtons.forEach(btn=>{
     btn.addEventListener('click', ()=>{
         granButtons.forEach(b=> b.classList.remove('bg-blue-500','text-white'));
         btn.classList.add('bg-blue-500','text-white');
         const gran = btn.dataset.gran;
         render(gran);
     });
  });

  function ready(){ render('day'); }
  if(window.Calendars) ready();
  window.addEventListener('CalendarsReady', ready);
});
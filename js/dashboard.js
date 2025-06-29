
const zones=[{l:'纽约',tz:'America/New_York'},{l:'瓦伦西亚',tz:'Europe/Madrid'},{l:'上海',tz:'Asia/Shanghai'}];
function tick(){const wrap=document.getElementById('clocks');wrap.innerHTML='';zones.forEach(z=>{const t=new Date().toLocaleTimeString('zh-CN',{hour12:false,timeZone:z.tz});const span=document.createElement('span');span.textContent=`${z.l} ${t}`;wrap.appendChild(span);});}
setInterval(tick,1000);tick();

document.getElementById('importBtn').onclick=()=>{const f=document.createElement('input');f.type='file';f.accept='.json';f.onchange=e=>importJSON(e.target.files[0],()=>location.reload());f.click();};
document.getElementById('exportBtn').onclick=exportJSON;

const modal=document.getElementById('modal');
document.getElementById('addBtn').onclick=()=>{modal.style.display='flex';document.getElementById('tDate').value=new Date().toISOString().slice(0,10);};
document.getElementById('cancel').onclick=()=>modal.style.display='none';
document.getElementById('saveTrade').onclick=()=>{const t={date:document.getElementById('tDate').value,ticker:document.getElementById('tTicker').value.toUpperCase(),type:document.getElementById('tType').value,price:+document.getElementById('tPrice').value,quantity:+document.getElementById('tQty').value};addTrade(t);modal.style.display='none';location.reload();};

(async function render(){
 const trades=loadTrades();
 // summary metrics
 const today=new Date().toISOString().slice(0,10);
 let dayTrades=trades.filter(t=>t.date===today);
 const stocks=Object.values(trades.reduce((m,t)=>(m[t.ticker]=m[t.ticker]||[],m[t.ticker].push(t),m),{}));
 let accountCost=0,currentValue=0,unreal=0;
 const posRows=[];
 for(const arr of stocks){
   const m=fifoMetrics(arr);
   const p=await getPrice(arr[0].ticker);
   const pl=(p-m.avgCost)*m.netQty;
   unreal+=pl;currentValue+=p*m.netQty;accountCost+=m.avgCost*m.netQty;
   posRows.push({...m,ticker:arr[0].ticker,price:p,pl});
 }
 const sum=document.getElementById('summary');
 const box=(title,val)=>{const d=document.createElement('div');d.className='box';d.innerHTML=`<h4>${title}</h4><p>${val}</p>`;sum.appendChild(d);};
 box('账户总成本',accountCost.toFixed(2));
 box('现有市值',currentValue.toFixed(2));
 box('当前浮盈亏',unreal.toFixed(2));
 // day realized simplified sum of todays sell/cover
 const dayRealized=dayTrades.filter(t=>t.type==='sell'||t.type==='cover').reduce((s,t)=>s+t.price*t.quantity,0);
 box('当日已实现盈亏',dayRealized.toFixed(2));
 box('当日盈亏笔数',dayTrades.length);
 box('当日交易次数',dayTrades.length);
 box('累计交易次数',trades.length);
 const histRealized=trades.filter(t=>t.type==='sell'||t.type==='cover').reduce((s,t)=>s+t.price*t.quantity,0);
 box('历史已实现盈亏',histRealized.toFixed(2));

 const tbody=document.querySelector('#posTable tbody');tbody.innerHTML='';
 posRows.forEach(r=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${r.ticker}</td><td>${r.netQty}</td><td>${r.avgCost.toFixed(2)}</td><td>${r.pl.toFixed(2)}</td><td>${r.breakeven.toFixed(2)}</td><td>${r.histPL.toFixed(2)}</td><td>${r.histTrades}</td><td><a href="stock.html?ticker=${r.ticker}">详情</a></td>`;
  tbody.appendChild(tr);
 });

 // recent trades table
 const rtbody=document.getElementById('recentTable')?.querySelector('tbody');
 if(rtbody){
   rtbody.innerHTML='';
   const sorted=[...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
   sorted.forEach(t=>{
     const tr=document.createElement('tr');
     const amt=t.price*t.quantity;
     tr.innerHTML=`<td>${t.date}</td><td>${t.ticker}</td><td>${t.type}</td><td>${t.price}</td><td>${t.quantity}</td><td style="color:${(t.type==='sell'||t.type==='cover'||t.type==='short')?'#ff4444':''}">${amt.toFixed(2)}</td>`;
     rtbody.appendChild(tr);
   });
 }

})();

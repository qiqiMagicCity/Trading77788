
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
 
 const sum=document.getElementById('summary');sum.innerHTML='';
 const addBox=(t,v)=>{const d=document.createElement('div');d.className='box';d.innerHTML=`<h4>${t}</h4><p>${fmt(v)}</p>`;sum.appendChild(d);};
 const todayResult=todayRealized(trades,today);
 addBox('账户总成本',accountCost);
 addBox('现有市值',currentValue);
 addBox('当前浮盈亏',unreal);
 addBox('今日已实现盈亏',todayResult.realized);
 addBox('今日盈亏笔数',todayResult.pairs);
 addBox('今日交易次数',dayTrades.length);
 addBox('累计交易次数',trades.length);
 const histRealized=trades.filter(t=>['sell','cover'].includes(t.type)).reduce((s,t)=>s+t.price*t.quantity,0);
 addBox('历史已实现盈亏',histRealized);

 box('历史已实现盈亏',histRealized.toFixed(2));

 const tbody=document.querySelector('#posTable tbody');tbody.innerHTML='';
 posRows.forEach(r=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${r.ticker}</td><td>${fmt(r.netQty)}</td><td>${fmt(r.avgCost)}</td><td>${fmt(r.pl)}</td><td>${fmt(r.breakeven)}</td><td>${fmt(r.histPL)}</td><td>${r.histTrades}</td><td><a href="stock.html?ticker=${r.ticker}">详情</a></td>`;
  tbody.appendChild(tr);
 });

 
   rtbody.innerHTML='';
   const sorted=[...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100);
   sorted.forEach((t,idx)=>{
     const tr=document.createElement('tr');
     const amt=fmt(t.price*t.quantity);
     tr.innerHTML=`
       <td>${t.date}</td>
       <td>${t.ticker}</td>
       <td>${t.type}</td>
       <td>${t.price}</td>
       <td>${t.quantity}</td>
       <td style="color:${(t.type==='sell'||t.type==='cover'||t.type==='short')?'#ff4444':''}">${amt}</td>
       <td><a href="stock.html?ticker=${t.ticker}">详情</a></td>
       <td><button data-i="${idx}" class="delBtn">删除</button></td>`;
     rtbody.appendChild(tr);
   });
   document.querySelectorAll('.delBtn').forEach(btn=>{
      btn.onclick=()=>{const id=parseInt(btn.dataset.i);const sorted=[...loadTrades()].sort((a,b)=>b.date.localeCompare(a.date));const trade=sorted[id];const all=loadTrades();const index=all.findIndex(x=>x===trade);if(index>-1){deleteTrade(index);location.reload();}};
   });



 // === 最新交易区 ===
 const recentBody = document.querySelector('#recentTable tbody');
 if(recentBody){
   recentBody.innerHTML='';
   const recent=[...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100);
   recent.forEach((t,idx)=>{
     const tr=document.createElement('tr');
     const amt=fmt(t.price*t.quantity);
     tr.innerHTML = `
       <td>${t.date}</td>
       <td>${t.ticker}</td>
       <td>${t.type}</td>
       <td>${t.price}</td>
       <td>${t.quantity}</td>
       <td style="color:${['sell','cover','short'].includes(t.type)?'#ff4444':''}">${amt}</td>
       <td><a href="stock.html?ticker=${t.ticker}">详情</a></td>
       <td><button data-idx="${idx}">删除</button></td>`;
     recentBody.appendChild(tr);
   });
   // 删除逻辑
   recentBody.querySelectorAll('button').forEach(btn=>{
     btn.onclick=()=>{
       const idx=parseInt(btn.dataset.idx);
       const sorted=[...loadTrades()].sort((a,b)=>b.date.localeCompare(a.date));
       const trade=sorted[idx];
       const all=loadTrades();
       const realIndex=all.findIndex(x=>x===trade);
       if(realIndex>-1){deleteTrade(realIndex);location.reload();}
     };
   });
 }

})();


(async function(){
 const tk=new URLSearchParams(location.search).get('ticker');
 document.getElementById('title').textContent=tk;
 const all=loadTrades().filter(t=>t.ticker===tk);
 const metrics=fifoMetrics(all);const cur=await getPrice(tk);
 const unreal=(cur-metrics.avgCost)*metrics.netQty;
 const sumDiv=document.getElementById('stockSummary');
 const box=(t,v)=>{const d=document.createElement('div');d.className='box';d.innerHTML=`<h4>${t}</h4><p>${v}</p>`;sumDiv.appendChild(d);};
 box('净持仓',metrics.netQty);
 box('均价',fmt(metrics.avgCost));
 box('现价',fmt(cur));
 box('浮盈亏',fmt(unreal));

 const tb=document.querySelector('#tradeTable tbody');tb.innerHTML='';
 let counter=0;
 all.sort((a,b)=>a.date.localeCompare(b.date)).forEach(r=>{
  counter+=1;
  const amt=r.price*r.quantity;
  const weekday=new Date(r.date).toLocaleDateString('zh-CN',{weekday:'short'});
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td>${r.date} ${weekday}</td>
    <td>${counter}</td>
    <td>${r.type}</td>
    <td>${r.price}</td>
    <td>${r.quantity}</td>
    <td style="color:${(r.type==='sell'||r.type==='cover')?'#ff4444':''}">${fmt(amt)}</td>
    <td>${fmt(metrics.breakeven)}</td>
    <td>${fmt(metrics.histPL)}</td>
    <td>${metrics.netQty}</td>`;
  tb.appendChild(tr);
 });
})();

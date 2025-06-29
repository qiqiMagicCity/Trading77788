
(async function(){
 const params=new URLSearchParams(location.search);const tk=params.get('ticker');document.getElementById('title').textContent=tk;
 const all=loadTrades();const trades=all.filter(t=>t.ticker===tk);
 const metrics=fifoCalc(trades);const cur=await price(tk);const unreal=(cur-metrics.costPer)*metrics.net;
 const sum=document.getElementById('summary');const box=(t,v)=>{const d=document.createElement('div');d.className='summary-box';d.innerHTML=`<h4>${t}</h4><p>${v}</p>`;sum.appendChild(d);};
 box('净持仓',metrics.net);box('均价',metrics.costPer.toFixed(2));box('现价',cur.toFixed(2));box('浮盈亏',unreal.toFixed(2));
 const tbody=document.querySelector('#tradeTable tbody');
 trades.sort((a,b)=>a.date.localeCompare(b.date));
 trades.forEach(r=>{
  const amt=r.price*r.quantity;
  const tr=document.createElement('tr');
  const weekday=new Date(r.date).toLocaleDateString('zh-CN',{weekday:'short'});
  tr.innerHTML=`<td>${r.date} ${weekday}</td><td>${r.type}</td><td>${r.price}</td><td>${r.quantity}</td><td style="color:${r.type==='sell' || r.type==='cover'?'#ff4e4e':'#fff'}">${amt.toFixed(2)}</td><td>${metrics.breakeven.toFixed(2)}</td><td>${metrics.histPL.toFixed(2)}</td><td>${metrics.net}</td>`;
  tbody.appendChild(tr);
 });
})();

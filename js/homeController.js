
import { loadTrades } from './utils/dataService.js';
(async ()=>{
  const trades = await loadTrades();
  if(!trades.length) return;
  // sort by date descending
  trades.sort((a,b)=> new Date(b.date) - new Date(a.date));
  // render recent trades table
  const tbl = document.getElementById('recent-trades');
  if(tbl){
    tbl.innerHTML='';
    trades.slice(0,10).forEach(tx=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${tx.date}</td><td>${tx.symbol}</td><td>${tx.side}</td><td>${tx.price}</td><td>${tx.qty}</td>`;
      tbl.appendChild(tr);
    });
  }
  // positions aggregation
  const posTable=document.getElementById('positions');
  if(posTable){
    const map=new Map();
    trades.forEach(tx=>{
      const qty= (tx.side==='BUY'||tx.side==='COVER')? tx.qty : -tx.qty;
      if(!map.has(tx.symbol)) map.set(tx.symbol,0);
      map.set(tx.symbol,map.get(tx.symbol)+qty);
    });
    posTable.innerHTML='';
    map.forEach((qty,symbol)=>{
      if(qty===0) return;
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${symbol}</td><td>${qty}</td>`;
      posTable.appendChild(tr);
    });
  }
})();

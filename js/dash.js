
const zones=[{label:'纽约',offset:'America/New_York'},{label:'瓦伦西亚',offset:'Europe/Madrid'},{label:'上海',offset:'Asia/Shanghai'}];
function updateClock(){
 const wrap=document.getElementById('clocks');wrap.innerHTML='';
 zones.forEach(z=>{const d=new Date().toLocaleTimeString('zh-CN',{hour12:false,timeZone:z.offset});const span=document.createElement('span');span.textContent=`${z.label} ${d}`;wrap.appendChild(span);});
}
setInterval(updateClock,1000);updateClock();

const imp=document.getElementById('importBtn');const exp=document.getElementById('exportBtn');
imp.onclick=()=>{const f=document.createElement('input');f.type='file';f.accept='.json';f.onchange=e=>importJSON(e.target.files[0],()=>location.reload());f.click();};
exp.onclick=()=>exportJSON();

const modal=document.getElementById('modal');const addBtn=document.getElementById('addBtn');addBtn.onclick=()=>{modal.style.display='flex';document.getElementById('tDate').value=new Date().toISOString().slice(0,10);};
document.getElementById('cancel').onclick=()=>modal.style.display='none';
document.getElementById('saveTrade').onclick=()=>{const t={date:document.getElementById('tDate').value,ticker:document.getElementById('tTicker').value.toUpperCase(),type:document.getElementById('tType').value,price:Number(document.getElementById('tPrice').value),quantity:Number(document.getElementById('tQty').value)};addTrade(t);modal.style.display='none';location.reload();};

(async function render(){
 const trades=loadTrades();
 const grouped=group(trades);
 const summaryDiv=document.getElementById('summary');summaryDiv.innerHTML='';
 const tbody=document.querySelector('#posTable tbody');tbody.innerHTML='';
 for(const tk in grouped){
   const metrics=fifoCalc(grouped[tk]);
   const curPrice=await price(tk);
   const posPL=(curPrice-metrics.costPer)*metrics.net;
   // summary box not per ticker
   const tr=document.createElement('tr');
   tr.innerHTML=`<td>${tk}</td><td>${metrics.net}</td><td>${metrics.costPer.toFixed(2)}</td><td>${posPL.toFixed(2)}</td><td>${metrics.breakeven.toFixed(2)}</td><td>${metrics.histPL.toFixed(2)}</td><td>${metrics.histTrades}</td><td><a href="stock.html?ticker=${tk}">详情</a></td>`;
   tbody.appendChild(tr);
 }
})();

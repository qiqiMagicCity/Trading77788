
const fileInput=document.getElementById('fileInput');
fileInput.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{save(JSON.parse(ev.target.result).trades||[]);location.reload();};r.readAsText(f);}
document.getElementById('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify({trades:load()})],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='trades.json';a.click();}
document.getElementById('addBtn').onclick=()=>{const d=prompt('日期 YYYY-MM-DD');const t=prompt('代码');const type=prompt('类型 buy/sell');const p=+prompt('价格');const q=+prompt('数量');const arr=load();arr.push({date:d,ticker:t,type,price:p,quantity:q});save(arr);location.reload();}
(function(){
 const arr=load();const map=groupBy(arr,'ticker');const tbody=document.querySelector('#pos tbody');
 Object.keys(map).forEach(k=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${k}</td><td>${map[k].length}</td><td>-</td><td>-</td><td>-</td><td><a href="stock.html?ticker=${k}">详情</a></td>`;tbody.appendChild(tr);});
})();

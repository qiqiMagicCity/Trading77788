
const p=new URLSearchParams(location.search).get('ticker');document.getElementById('title').textContent=p;
const arr=load().filter(x=>x.ticker===p);const tb=document.querySelector('#history tbody');
arr.forEach(r=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${r.date}</td><td>${r.type}</td><td>${r.price}</td><td>${r.quantity}</td>`;tb.appendChild(tr);});

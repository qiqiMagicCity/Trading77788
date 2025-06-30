
(function(){
const tbl=document.getElementById('all-trades');
function render(){
  const trades=JSON.parse(localStorage.getItem('trades')||'[]');
  const head=['#','日期','代码','方向','单价','数量','金额','编辑','删除'];
  tbl.innerHTML='<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
  trades.forEach((t,i)=>{
    const amt=(t.qty*t.price).toFixed(2);
    tbl.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${i+1}</td><td>${t.date}</td><td>${t.symbol}</td><td>${t.side}</td>
        <td>${t.price.toFixed(2)}</td><td>${t.qty}</td><td>${amt}</td>
        <td><button data-edit="${i}">编辑</button></td>
        <td><button data-del="${i}">删除</button></td>
      </tr>`);
  });
  tbl.querySelectorAll('button[data-del]').forEach(btn=>{
    btn.onclick=()=>{
      const idx=parseInt(btn.getAttribute('data-del'),10);
      if(!confirm('确定删除该交易?')) return;
      const arr=JSON.parse(localStorage.getItem('trades')||'[]');
      arr.splice(idx,1);
      localStorage.setItem('trades',JSON.stringify(arr));
      location.reload();
    };
  });
  tbl.querySelectorAll('button[data-edit]').forEach(btn=>{
    btn.onclick=()=>{
      const idx=parseInt(btn.getAttribute('data-edit'),10);
      // delegate to index page modal
      localStorage.setItem('editIndex',idx);
      location.href='index.html#edit';
    };
  });
}
render();

/* clocks */
function updateClocks(){
  const now=new Date();
  const ny   = new Date(now.toLocaleString('en-US',{timeZone:'America/New_York'}));
  const val  = new Date(now.toLocaleString('en-GB',{timeZone:'Europe/Madrid'}));
  const sh   = new Date(now.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}));
  const fmt=d=>d.toTimeString().slice(0,8);
  document.getElementById('clocks').innerHTML=
      `纽约：${fmt(ny)} | 瓦伦西亚：${fmt(val)} | 上海：${fmt(sh)}`;
}
updateClocks(); setInterval(updateClocks,1000);
})();

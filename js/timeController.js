// Uses global Luxon loaded in index.html
(function(){
  const { DateTime } = luxon;
  function fmt(dt){ return dt.toFormat('HH:mm:ss'); }
  function update(){
    const ny = DateTime.now().setZone('America/New_York');
    const va = ny.setZone('Europe/Madrid');
    const sh = ny.setZone('Asia/Shanghai');
    const elNy = document.getElementById('time-ny');
    if(elNy) elNy.textContent = fmt(ny);
    const elVa = document.getElementById('time-va');
    if(elVa) elVa.textContent = fmt(va);
    const elSh = document.getElementById('time-sh');
    if(elSh) elSh.textContent = fmt(sh);
    const elDate = document.getElementById('date-today');
    if(elDate) elDate.textContent = ny.toFormat('yyyy年MM月dd日 cccc');
  }
  update();
  setInterval(update, 1000);
})();
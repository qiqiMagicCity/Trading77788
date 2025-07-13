// Uses global Luxon loaded in index.html
(function(){
  const { DateTime } = luxon;
  function fmt(dt){ return dt.toFormat('HH:mm:ss'); }
  function update(){
    const ny = DateTime.now().setZone('America/New_York');
    const va = ny.setZone('Europe/Madrid');
    const sh = ny.setZone('Asia/Shanghai');
    document.getElementById('time-ny')?.textContent = fmt(ny);
    document.getElementById('time-va')?.textContent = fmt(va);
    document.getElementById('time-sh')?.textContent = fmt(sh);
    document.getElementById('date-today')?.textContent = ny.toFormat('yyyy年MM月dd日 cccc');
  }
  update();
  setInterval(update, 1000);
})();
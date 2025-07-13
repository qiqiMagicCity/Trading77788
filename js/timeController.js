// Auto-generated timeController.js
function fmt(n){return n.toString().padStart(2,'0');}
const zones = {ny:-4, va:2, sh:8};  // offsets relative UTC in hours (NY summer time)
function update(){
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset()*60000;
  const ny = new Date(utcMs + zones.ny*3600000);
  const va = new Date(utcMs + zones.va*3600000);
  const sh = new Date(utcMs + zones.sh*3600000);
  document.getElementById('time-ny')?.textContent = `${fmt(ny.getHours())}:${fmt(ny.getMinutes())}:${fmt(ny.getSeconds())}`;
  document.getElementById('time-va')?.textContent = `${fmt(va.getHours())}:${fmt(va.getMinutes())}:${fmt(va.getSeconds())}`;
  document.getElementById('time-sh')?.textContent = `${fmt(sh.getHours())}:${fmt(sh.getMinutes())}:${fmt(sh.getSeconds())}`;
  document.getElementById('date-today')?.textContent = ny.toISOString().slice(0,10).replace(/-/g,'/');
}
update();
setInterval(update,1000);

console.log('dashboard.view loaded');
// simple formatter
function fmt(v){
  if(typeof v==='number') return Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);
  return v;
}
function update(id,val){
  const el=document.getElementById(id);
  if(el) el.textContent=fmt(val);
}
// listen M1-M13
for(let i=1;i<=13;i++){
  window.addEventListener(`M${i}:update`,e=>{
    update(`M${i}-value`, e.detail.value ?? e.detail);
  });
}
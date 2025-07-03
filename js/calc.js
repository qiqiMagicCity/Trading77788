(function(g){
function fmtSign(n){
  const cls=n>0?'green':n<0?'red':'white';
  const val=Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `<span class="${cls}">${n<0?'-':''}${val}</span>`;
}
function fmtDollar(n){return `$ ${fmtSign(n)}`;}
function fmtInt(n){return `<span class="white">${Number(n).toLocaleString()}</span>`;}
function fmtWL(w,l){return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`;}

function fmtPct(p){
  const val=(p*100).toFixed(1)+'%';
  const cls=p>0.5?'green':p<0.5?'red':'white';
  return `<span class="${cls}">${val}</span>`;
}

g.Utils={fmtDollar,fmtInt,fmtWL,fmtPct};
})(window);

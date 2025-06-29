
const TOKEN='d19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
const priceCache={};
async function price(t){if(priceCache[t])return priceCache[t];const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${t}&token=${TOKEN}`);const d=await r.json();priceCache[t]=d.c||0;return priceCache[t];}

function group(trades){return trades.reduce((m,t)=>(m[t.ticker]=m[t.ticker]||[],m[t.ticker].push(t),m),{});}

function fifoCalc(trades){ // returns {net,cost,totalInvest,breakeven,histPL,histTrades}
 let net=0,totalCost=0,histPL=0,histTrades=trades.length;
 const lot=[];
 trades.forEach(t=>{
  const q=Number(t.quantity),p=Number(t.price);
  if(t.type==='buy'||t.type==='cover'){lot.push({q,p});net+=q;}
  else{ // sell or short
    let rem=q;
    while(rem>0&&lot.length){const l=lot[0];const m=Math.min(rem,l.q);histPL+=(p-l.p)*m; l.q-=m;rem-=m;if(l.q===0)lot.shift();}
    net-=q;
  }
 });
 totalCost=lot.reduce((s,l)=>s+l.p*l.q,0);
 const breakeven=net? (totalCost/net):0;
 const costPer=net?totalCost/net:0;
 return {net,costPer,breakeven,histPL,histTrades};
}

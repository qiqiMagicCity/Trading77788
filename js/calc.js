
const TOKEN='d19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
const priceCache={};
async function getPrice(tk){
 if(priceCache[tk]) return priceCache[tk];
 try{
  const res=await fetch(`https://finnhub.io/api/v1/quote?symbol=${tk}&token=${TOKEN}`);
  const d=await res.json();priceCache[tk]=d.c||0;return priceCache[tk];
 }catch(e){return 0;}
}

function fifoMetrics(trades){
 // Returns object with netQty, avgCost, breakeven, histPL, histTrades
 let net=0,totalCost=0,balancePL=0;
 const lots=[];
 trades.forEach(tr=>{
  const q=Number(tr.quantity),p=Number(tr.price);
  if(tr.type==='buy'||tr.type==='cover'){lots.push({q,p});net+=q;}
  else{ // sell/short close
    let rem=q;
    while(rem>0&&lots.length){
      const lot=lots[0];const m=Math.min(rem,lot.q);
      balancePL+= (p-lot.p)*(tr.type==='sell'?m:-m); // short sell reversing
      lot.q-=m;rem-=m;if(lot.q===0)lots.shift();
    }
    net-=q;
  }
 });
 totalCost=lots.reduce((s,l)=>s+l.p*l.q,0);
 const breakeven=net? (totalCost/net):0;
 const costPer=net?totalCost/net:0;
 return {netQty:net,avgCost:costPer,breakeven,histPL:balancePL,histTrades:trades.length};
}

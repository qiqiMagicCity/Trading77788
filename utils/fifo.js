export function buildFIFO(trades){
  // trades: array of {date, symbol, qty, price, side}
  if(!Array.isArray(trades)){
    console.warn('buildFIFO expects array, got', typeof trades);
    return [];
  }
  const holdings = {};
  const batches = [];
  trades.forEach(t=>{
    const {symbol, qty, price, side}=t;
    if(side==='BUY'){
      batches.push({symbol, qty, price, side:'LONG'});
    }else if(side==='SELL'){
      let remain=qty;
      for(const b of batches){
        if(b.symbol===symbol && b.side==='LONG' && b.qty>0){
          const q=Math.min(remain,b.qty);
          b.qty-=q;
          remain-=q;
          if(remain===0) break;
        }
      }
    }
  });
  return batches.filter(b=>b.qty>0);
}
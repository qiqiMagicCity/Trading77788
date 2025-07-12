// Trading77788 v6 - M10.js generated 2025-07-12


import {buildBook,process} from '../helpers/fifo.js';
export default function M10(trades){
  const b=buildBook();
  let W=0,L=0;
  trades.forEach(t=>process(b,t,lot=>{
    const p=(lot.close.side==='SELL')?
      (lot.close.price-lot.price)*lot.qty:
      (lot.price-lot.close.price)*lot.qty;
    if(p>0) W++; else if(p<0) L++;
  }));
  const tot=W+L;
  return {W,L,winRate:tot?W/tot*100:0};
}

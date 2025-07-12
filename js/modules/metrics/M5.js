// Trading77788 v6 - M5.js generated 2025-07-12


import {todayStr} from '../../utils/timeNY.js';
export default function M5(trades){
  const today=todayStr();
  const todayTrades=trades.filter(t=>t.date===today);
  const buyStack={}, shortStack={};
  let m51=0,m52=0;
  function push(stack,sym,lot){(stack[sym]=stack[sym]||[]).push(lot);}
  function match(stack,sym,qty,cb){
    const arr=stack[sym]||[];
    while(qty>0 && arr.length){
      const lot=arr[0];
      const use=Math.min(qty,lot.qty);
      cb(lot, use);
      lot.qty-=use;
      qty-=use;
      if(lot.qty===0) arr.shift();
    }
    return qty;
  }
  const fifoCost={}; // symbol -> FIFO cost tracker from previous days isn't available for m5.2 sample limited.
  todayTrades.forEach(t=>{
    if(t.side==='BUY') push(buyStack,t.symbol,{qty:t.qty,price:t.price});
    else if(t.side==='SHORT') push(shortStack,t.symbol,{qty:t.qty,price:t.price});
    else if(t.side==='SELL'){
      let remain=t.qty;
      remain=match(buyStack,t.symbol,remain,(lot,use)=>{
        m51+=(t.price-lot.price)*use;
        m52+=(t.price-lot.price)*use;
      });
    }else if(t.side==='COVER'){
      let remain=t.qty;
      remain=match(shortStack,t.symbol,remain,(lot,use)=>{
        m51+=(lot.price-t.price)*use;
        m52+=(lot.price-t.price)*use;
      });
    }
  });
  return {behavior:m51,fifo:m52};
}

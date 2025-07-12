// Trading77788 v6 - M9.js generated 2025-07-12


import {buildBook,process} from '../helpers/fifo.js';
export default function M9(trades){
  const book=buildBook();
  let pl=0;
  process;
  trades.forEach(t=>process(book,t,lot=>{
    pl+=(lot.close.side==='SELL')?
      (lot.close.price-lot.price)*lot.qty:
      (lot.price-lot.close.price)*lot.qty;
  }));
  return pl;
}

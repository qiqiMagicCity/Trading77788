// Trading77788 v6 - M4.js generated 2025-07-12


import {buildBook,process} from '../helpers/fifo.js';
import {todayStr} from '../../utils/timeNY.js';
export default function M4(trades){
  const today=todayStr();
  const hist=trades.filter(t=>t.date<today);
  const book=buildBook();
  hist.forEach(t=>process(book,t));
  let realized=0;
  const callback=lot=>{
    if(lot.close.date!==today) return;
    const dir=lot.close.side==='SELL'?'long':'short';
    realized+= dir==='long' ? (lot.close.price-lot.price)*lot.qty : (lot.price-lot.close.price)*lot.qty;
  };
  trades.filter(t=>t.date===today).forEach(t=>process(book,t,callback));
  return realized;
}

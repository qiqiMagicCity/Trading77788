// Trading77788 v6 - positions.js generated 2025-07-12


import {buildBook,process} from './fifo.js';
export function openPositions(trades){
  const book=buildBook();
  trades.forEach(t=>process(book,t));
  const pos=[];
  for(const s in book){
    book[s].long.forEach(l=>pos.push({symbol:s,side:'long',qty:l.qty,price:l.price}));
    book[s].short.forEach(l=>pos.push({symbol:s,side:'short',qty:l.qty,price:l.price}));
  }
  return pos;
}

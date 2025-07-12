// Trading77788 v6 - fifo.js generated 2025-07-12


export function buildBook(){return {};}
function push(arr,lot){ if(lot.qty>0) arr.push({...lot}); }
function pop(arr,qty){
  const out=[];
  while(qty>0 && arr.length){
    const f=arr[0];
    const use=Math.min(qty,f.qty);
    out.push({...f,qty:use});
    f.qty-=use;
    qty-=use;
    if(f.qty===0) arr.shift();
  }
  return out;
}
export function process(state,t,cb){
  const b=state[t.symbol]||(state[t.symbol]={long:[],short:[]});
  if(t.side==='BUY') push(b.long,{qty:t.qty,price:t.price,date:t.date});
  else if(t.side==='SHORT') push(b.short,{qty:t.qty,price:t.price,date:t.date});
  else if(t.side==='SELL'){
    const lots=pop(b.long,t.qty);
    lots.forEach(l=>cb&&cb({...l,close:t}));
  }else if(t.side==='COVER'){
    const lots=pop(b.short,t.qty);
    lots.forEach(l=>cb&&cb({...l,close:t}));
  }
}

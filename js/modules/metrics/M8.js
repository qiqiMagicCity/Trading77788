// Trading77788 v6 - M8.js generated 2025-07-12


export default function M8(trades){
  const c={B:0,S:0,P:0,C:0};
  trades.forEach(t=>{
    if(t.side==='BUY') c.B++;
    else if(t.side==='SELL') c.S++;
    else if(t.side==='SHORT') c.P++;
    else if(t.side==='COVER') c.C++;
  });
  c.total=c.B+c.S+c.P+c.C;
  return c;
}

// Trading77788 v6 - M7.js generated 2025-07-12


import {todayStr} from '../../utils/timeNY.js';
export default function M7(trades){
  const today=todayStr();
  const c={B:0,S:0,P:0,C:0};
  trades.filter(t=>t.date===today).forEach(t=>{
    if(t.side==='BUY') c.B++;
    else if(t.side==='SELL') c.S++;
    else if(t.side==='SHORT') c.P++;
    else if(t.side==='COVER') c.C++;
  });
  c.total=c.B+c.S+c.P+c.C;
  return c;
}

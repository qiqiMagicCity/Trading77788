// Trading77788 v6 - M2.js generated 2025-07-12


export default function M2(pos,priceMap){
  return pos.reduce((a,p)=>a+Math.abs((priceMap[p.symbol]||0)*p.qty),0);
}

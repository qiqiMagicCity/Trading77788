// Trading77788 v6 - M3.js generated 2025-07-12


export default function M3(pos,priceMap){
  let pl=0;
  for(const p of pos){
    const cur=priceMap[p.symbol]||0;
    pl+= (p.side==='long'? (cur-p.price) : (p.price-cur))*p.qty;
  }
  return pl;
}

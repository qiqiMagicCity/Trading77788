// Trading77788 v6 - M1.js generated 2025-07-12


export default function M1(pos){
  return pos.reduce((a,p)=>a+p.price*p.qty,0);
}

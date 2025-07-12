// Trading77788 v6 - M11.js generated 2025-07-12


export default function M11(daily){return daily.reduce((a,d)=>a+d.realized+d.unrealized,0);}

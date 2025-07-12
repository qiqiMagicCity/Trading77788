// Trading77788 v6 - M12.js generated 2025-07-12


export default function M12(daily){return daily.reduce((a,d)=>a+d.realized+d.unrealized,0);}

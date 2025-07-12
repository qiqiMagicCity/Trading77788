const API_KEY='';
export async function getPrice(symbol){
  try{
    // attempt live api
    const url=`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
    const res = await fetch(url);
    if(res.ok){
      const j = await res.json();
      if(j.c) return j.c;
    }
  }catch(e){ console.warn('live price fail',e);}
  try{
    const today = new Date().toISOString().slice(0,10);
    const close = await fetch('./close_prices.json').then(r=>r.json());
    if(close[today] && close[today][symbol]!==undefined) return close[today][symbol];
  }catch(e){}
  return 0;
}
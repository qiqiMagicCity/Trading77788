export async function getTrades(){
  try{
    const res = await fetch('./trades.json');
    if(res.ok) return res.json();
  }catch(e){}
  return [];
}
export async function getDailyClose(){
  try{
    const res = await fetch('./dailyClose.json');
    if(res.ok) return res.json();
  }catch(e){}
  return [];
}
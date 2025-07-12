import ModuleBase from '../ModuleBase.js';
import { getTrades, getDailyClose } from '../../utils/dataStore.js';
import { getPrice } from '../../utils/priceService.js';

function startOf(period, date=new Date()){
  const d=new Date(date);
  if(period==='week'){
    const day=(d.getDay()+6)%7; // Monday start
    d.setDate(d.getDate()-day);
  }else if(period==='month'){
    d.setDate(1);
  }else if(period==='year'){
    d.setMonth(0); d.setDate(1);
  }
  d.setHours(0,0,0,0);
  return d;
}

class M11Logic extends ModuleBase{
  constructor(){ super('M11'); this.calc(); }
  async calc(){
    const trades = await getTrades();
    const daily = await getDailyClose(); // assume array {date, float, realized}
    const start = startOf('week');
    let pnl=0;
    daily.filter(r=>new Date(r.date)>=start).forEach(r=>{ pnl+=r.float + r.realized; });
    this.publish({value:pnl});
  }
}
window['M11Logic']=new M11Logic();
export default window['M11Logic'];
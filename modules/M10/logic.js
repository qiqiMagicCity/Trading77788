import ModuleBase from '../ModuleBase.js';
import { getTrades } from '../../utils/dataStore.js';

class M10Logic extends ModuleBase{
  constructor(){ super('M10'); this.calc(); }
  async calc(){ try{
    const trades = await getTrades();
    let wins=0, losses=0;
    trades.forEach(t=>{
      if(t.pnl>0) wins++;
      else if(t.pnl<0) losses++;
  }catch(err){
    this.publish({error: err.message});
    this.log(err);
  } });
    const total=wins+losses;
    const winRate = total>0 ? wins/total*100 : 0;
    this.publish({wins,losses,winRate});
  }
}
window['M10Logic']=new M10Logic();
export default window['M10Logic'];
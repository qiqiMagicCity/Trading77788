import ModuleBase from '../ModuleBase.js';
import { getDailyResults, calcSince } from '../../utils/dailyResult.js';
class M13Logic extends ModuleBase{
 constructor(){ super('M13'); this.calc(); }
 async calc(){ try{
    const list = await getDailyResults();
   const total = calcSince(list,'2025-01-01');
   this.publish({value:total
  }catch(err){
    this.publish({error: err.message});
    this.log(err);
  } });
 }
}
window['M13Logic']=new M13Logic();
export default window['M13Logic'];
import ModuleBase from '../ModuleBase.js';
import { getDailyResults, calcWTD } from '../../utils/dailyResult.js';
class M11Logic extends ModuleBase{
 constructor(){ super('M11'); this.calc(); }
 async calc(){ try{
    const list= await getDailyResults();
   const total = calcWTD(list);
   this.publish({value:total
  }catch(err){
    this.publish({error: err.message});
    this.log(err);
  } });
 }
}
window['M11Logic']=new M11Logic();
export default window['M11Logic'];
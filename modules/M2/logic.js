import ModuleBase from '../ModuleBase.js';
class M2Logic extends ModuleBase {
  constructor(){ super('M2'); this.calc(); }
  calc(){ try{
    this.publish({value:0
  }catch(err){
    this.publish({error: err.message});
    this.log(err);
  } }); }
}
window['M2Logic'] = new M2Logic();
export default window['M2Logic'];
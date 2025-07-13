import ModuleBase from '../ModuleBase.js';
class M1Logic extends ModuleBase {
  constructor(){ super('M1'); this.calc(); }
  calc(){ try{
    this.publish({value:0
  }catch(err){
    this.publish({error: err.message});
    this.log(err);
  } }); }
}
window['M1Logic'] = new M1Logic();
export default window['M1Logic'];
import ModuleBase from '../ModuleBase.js';
class M13Logic extends ModuleBase {
  constructor(){ super('M13'); this.calc(); }
  calc(){ this.publish({value:0}); }
}
window['M13Logic'] = new M13Logic();
export default window['M13Logic'];
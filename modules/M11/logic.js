import ModuleBase from '../ModuleBase.js';
class M11Logic extends ModuleBase {
  constructor(){ super('M11'); this.calc(); }
  calc(){ this.publish({value:0}); }
}
window['M11Logic'] = new M11Logic();
export default window['M11Logic'];
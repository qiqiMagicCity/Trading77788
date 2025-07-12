import ModuleBase from '../ModuleBase.js';
class M12Logic extends ModuleBase {
  constructor(){ super('M12'); this.calc(); }
  calc(){ this.publish({value:0}); }
}
window['M12Logic'] = new M12Logic();
export default window['M12Logic'];
import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';

class M4View extends ModuleBase {
  constructor() {
    super('M4');
    this.container = document.querySelector('#M4-value');
    this.subscribe(e => this.render(e.detail));
  }
  render(data) {
    ModuleBase.safeRender(this.container, data);
  }
}
export default new M4View();

import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';

class M5View extends ModuleBase {
  constructor() {
    super('M5');
    this.container = document.querySelector('#M5-value');
    this.subscribe(e => this.render(e.detail));
  }
  render(data) {
    ModuleBase.safeRender(this.container, data);
  }
}
export default new M5View();

import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';

class M11View extends ModuleBase {
  constructor() {
    super('M11');
    this.container = document.querySelector('#M11-value');
    this.subscribe(e => this.render(e.detail));
  }
  render(data) {
    ModuleBase.safeRender(this.container, data);
  }
}
export default new M11View();

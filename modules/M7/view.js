import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';

class M7View extends ModuleBase {
  constructor() {
    super('M7');
    this.container = document.querySelector('#M7-value');
    this.subscribe(e => this.render(e.detail));
  }
  render(data) {
    ModuleBase.safeRender(this.container, data);
  }
}
export default new M7View();

import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';

class M3View extends ModuleBase {
  constructor() {
    super('M3');
    this.container = document.querySelector('#M3-value');
    this.subscribe(e => this.render(e.detail));
  }
  render(data) {
    ModuleBase.safeRender(this.container, data);
  }
}
export default new M3View();

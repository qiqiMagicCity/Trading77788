import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';
class M7View extends ModuleBase {
  constructor(){ super('M7'); this.container=document.querySelector('#M7-value'); this.subscribe(e=>this.render(e.detail)); }
  render(data){ 
    if(!this.container) return;
    if(data && data.error){ this.container.textContent = 'ERR'; return; }
    this.container.textContent = safeNumber(data.value);
  }
}
window['M7View'] = new M7View();
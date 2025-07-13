import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';
class M3View extends ModuleBase {
  constructor(){ super('M3'); this.container=document.querySelector('#M3-value'); this.subscribe(e=>this.render(e.detail)); }
  render(data){ 
    if(!this.container) return;
    if(data && data.error){ this.container.textContent = 'ERR'; return; }
    this.container.textContent = safeNumber(data.value);
  }).format(val); 
  }
}
window['M3View'] = new M3View();
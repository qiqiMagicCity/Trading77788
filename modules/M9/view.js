import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';
class M9View extends ModuleBase{
  constructor(){ super('M9'); this.container=document.querySelector('#M9-value'); this.subscribe(e=>this.render(e.detail));}
  render(data){ 
    if(!this.container) return;
    if(data && data.error){ this.container.textContent = 'ERR'; return; }
    this.container.textContent = safeNumber(data.value);
  }).format(data.value);
  }
}
window['M9View']=new M9View();
import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';
class M13View extends ModuleBase{
  constructor(){ super('M13'); this.container=document.querySelector('#M13-value'); this.subscribe(e=>this.render(e.detail));}
  render(data){ 
    if(!this.container) return;
    if(data && data.error){ this.container.textContent = 'ERR'; return; }
    this.container.textContent = safeNumber(data.value);
  }).format(data.value);}
}
window['M13View']=new M13View();
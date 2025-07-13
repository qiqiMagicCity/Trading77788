import ModuleBase from '../ModuleBase.js';
import './logic.js';
import { safeNumber } from '../../utils/renderUtils.js';
class M5View extends ModuleBase{
  constructor(){ super('M5'); this.container=document.querySelector('#M5-value'); this.subscribe(e=>this.render(e.detail)); }
  render(data){ 
    if(!this.container) return;
    if(data && data.error){ this.container.textContent = 'ERR'; return; }
    this.container.textContent = safeNumber(data.value);
  } FIFO视角：${data.v2.toFixed(2)}`;
  }
}
window['M5View']=new M5View();
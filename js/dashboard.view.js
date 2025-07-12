/* M2/view.js
   负责 DOM 渲染
*/
import { init as logicInit } from './logic.js';
import ModuleBase from '../ModuleBase.js';
const NAME = 'M2';
const eventName = `${NAME}:update`;
export function init(containerSelector = '#M2') {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  window.addEventListener(eventName, (e) => {
    const { value } = e.detail;
    container.textContent = value.toLocaleString();
  });
  logicInit();
}
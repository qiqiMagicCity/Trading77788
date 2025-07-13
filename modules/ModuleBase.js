export default class ModuleBase {
  constructor(id){
    this.id = id;
    this.el = document.getElementById(`${id}-value`);
    if (!this.el) {
      console.warn(`[${id}] 未找到绑定元素`);
    }
    this.subscribe();
  }

  subscribe(){
    document.addEventListener(this.id, e => this.safeRender(e.detail));
  }

  publish(data){
    const event = new CustomEvent(this.id, { detail: data });
    document.dispatchEvent(event);
  }

  safeRender(data){
    if (!this.el) return;
    if (data && data.error){
      this.el.innerText = 'ERR';
      this.el.classList.add('error');
    } else {
      this.el.innerText = (data && data.value !== undefined) ? data.value : '--';
      this.el.classList.remove('error');
    }
  }

  log(...args){
    console.log(`[${this.id}]`, ...args);
  }
}
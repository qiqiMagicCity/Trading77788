export default class ModuleBase {
  constructor(name){
    this.name = name;
    this.eventName = `${name}:update`;
  }

  /* Format raw value into standard payload */
  format(value){ return { value }; }

  /* Safer publish: accept raw number or pre‑formatted payload */
  publish(data){
    const payload = (typeof data==='object' && data!==null && ('value' in data || 'error' in data))
      ? data
      : this.format(data);
    window.dispatchEvent(new CustomEvent(this.eventName,{ detail: payload }));
  }

  /* Convenience safe render helper */
  safeRender(container,data){
    if(!container) return;
    if(data && data.error){
      container.textContent = 'ERR';
      return;
    }
    const val = data && 'value' in data ? data.value : null;
    if(Number.isFinite(val)){
      container.textContent = val.toLocaleString();
    }else{
      container.textContent = 'ERR';
    }
  }

  subscribe(handler){ window.addEventListener(this.eventName,handler); }

  log(...msg){ console.log(`[${this.name}]`,...msg); }

  selfCheck(){ return true; }
}
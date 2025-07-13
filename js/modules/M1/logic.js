// js/modules/M1/logic.js
import ModuleBase from '../ModuleBase.js';
import { getTrades, getClosePrices } from '../../utils/dataStore.js';

class M1Logic extends ModuleBase {
  constructor() {
    super('M1');
    this.calc();
  }

  async calc() {
    try {
      const trades = await getTrades();
      const prices = await getClosePrices();
      // TODO: 用 m1.js 算法
      const resultValue = 88888; // 临时测试值，后续替换为真正计算
      this.publish({ value: resultValue });
    } catch (err) {
      this.publish({ error: err.message });
      this.log(err);
    }
  }
}

export default new M1Logic();
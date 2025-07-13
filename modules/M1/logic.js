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
      // TODO: 使用正确的算法模块 m1Calc(trades, prices)
      const resultValue = 88888; // 临时测试值，上传验证后再替换
      this.publish({ value: resultValue });
    } catch (err) {
      this.publish({ error: err.message });
      this.log(err);
    }
  }
}

export default new M1Logic();

// modules/M1/logic.js
import ModuleBase from '../ModuleBase.js';
import { getTrades, getClosePrices } from '../../../utils/dataStore.js';
import { calc as m1Calc } from '../../../services/metrics/m1.js';

class M1Logic extends ModuleBase {
  constructor() {
    super('M1');
    this.calc();
  }
  async calc() {
    try {
      const [trades, prices] = await Promise.all([getTrades(), getClosePrices()]);
      const result = m1Calc(trades, prices);
      this.publish(result);
    } catch (e) {
      this.publish({ error: e.message });
      this.log(e);
    }
  }
}

export default new M1Logic();
import ModuleBase from '../ModuleBase.js';
import { getTrades, getClosePrices } from '../../utils/dataStore.js';

class M11Logic extends ModuleBase {
  constructor() {
    super('M11');
    this.calc();
  }

  async calc() {
    try {
      // TODO: replace with real calculation for M11
      const trades = await getTrades();
      const prices = await getClosePrices();
      const result = 0;
      this.publish(result);
    } catch (err) {
      this.publish({ error: err.message });
      this.log(err);
    }
  }
}

export default new M11Logic();

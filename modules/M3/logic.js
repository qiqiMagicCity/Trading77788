import ModuleBase from '../ModuleBase.js';
import { getTrades, getClosePrices } from '../../utils/dataStore.js';

class M3Logic extends ModuleBase {
  constructor() {
    super('M3');
    this.calc();
  }

  async calc() {
    try {
      // TODO: replace with real calculation for M3
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

export default new M3Logic();

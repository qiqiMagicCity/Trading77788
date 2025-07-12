// Trading77788 v6 - metrics-engine.js generated 2025-07-12


import M1 from './metrics/M1.js';import M2 from './metrics/M2.js';import M3 from './metrics/M3.js';
import M4 from './metrics/M4.js';import M5 from './metrics/M5.js';import M6 from './metrics/M6.js';
import M7 from './metrics/M7.js';import M8 from './metrics/M8.js';import M9 from './metrics/M9.js';
import M10 from './metrics/M10.js';

import {openPositions} from './helpers/positions.js';

export async function compute(trades,priceMap){
  const pos=openPositions(trades);
  const m1=M1(pos),m2=M2(pos,priceMap),m3=M3(pos,priceMap),m4=M4(trades),m5=M5(trades),m6=M6(m4,m3),
        m7=M7(trades),m8=M8(trades),m9=M9(trades),m10=M10(trades);
  return {m1,m2,m3,m4,m5,m6,m7,m8,m9,m10};
}

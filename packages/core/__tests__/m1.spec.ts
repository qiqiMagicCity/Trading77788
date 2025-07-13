import { describe, it, expect } from 'vitest';
import { M1 } from '../algorithms/m1-cost';
import { CalcContext } from '../types';

describe('M1 持仓成本', () => {
  it('空仓返回 0', () => {
    const ctx = { positions: [], trades: [], prices: {}, today: new Date() } as CalcContext;
    expect(M1(ctx).value).toBe(0);
  });

  it('多空混合计算绝对成本', () => {
    const ctx: CalcContext = {
      positions: [
        { symbol: 'AAPL', qty: 10, entryPrice: 150 },
        { symbol: 'TSLA', qty: -5, entryPrice: 700 },
      ],
      trades: [],
      prices: {},
      today: new Date(),
    };
    expect(M1(ctx).value).toBe(5000);
  });
});

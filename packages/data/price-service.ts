import { PriceMap } from 'packages/core';

export const PriceService = {
  async get(symbols: string[]): Promise<PriceMap> {
    // Mocked prices; replace with real API calls
    return Object.fromEntries(symbols.map((s) => [s, Math.random() * 100]));
  }
};

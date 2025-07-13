import { Trade } from 'packages/core';

const KEY = 'trading_app_trades';

function load(): Trade[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export const TradeService = {
  async list(): Promise<Trade[]> {
    return load();
  },
  async save(trade: Trade): Promise<void> {
    const trades = load();
    trades.push(trade);
    localStorage.setItem(KEY, JSON.stringify(trades));
  }
};

export interface Trade {
  id: string;
  symbol: string;
  qty: number;              // Positive for long, negative for short
  price: number;            // Executed price
  side: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  date: string;             // ISO-8601
}

export interface Position {
  symbol: string;
  qty: number;
  entryPrice: number;
}

export type PriceMap = Record<string, number>;

export interface CalcContext {
  trades: Trade[];
  positions: Position[];
  prices: PriceMap;
  today: Date;
}

export interface ModuleResult<T = number | string | Record<string, number>> {
  id: `M${number}`;
  label: string;
  value: T;
}

export type CalcModule = (ctx: CalcContext) => ModuleResult;

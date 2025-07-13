import { M1 } from './algorithms/m1-cost';
export { M1 };
export * from './types';

export const registry = [M1];

export function runAll(ctx: Parameters<typeof M1>[0]) {
  return registry.map((mod) => mod(ctx));
}

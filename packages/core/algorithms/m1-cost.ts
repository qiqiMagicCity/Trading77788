import { CalcModule } from '../types';

export const M1: CalcModule = ({ positions }) => {
  const cost = positions.reduce(
    (sum, p) => sum + Math.abs(p.entryPrice * p.qty),
    0
  );
  return { id: 'M1', label: '持仓成本', value: cost };
};

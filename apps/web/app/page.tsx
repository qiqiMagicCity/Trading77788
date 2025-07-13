'use client';
import { useQuery } from '@tanstack/react-query';
import { runAll, CalcContext } from 'packages/core';
import { TradeService } from 'packages/data/trade-service';
import { PriceService } from 'packages/data/price-service';
import Card from '../components/Card';
import { derivePositions } from '../lib/derive-positions';

export default function Dashboard() {
  const { data } = useQuery(['metrics'], async () => {
    const trades = await TradeService.list();
    const positions = derivePositions(trades);
    const prices = await PriceService.get(positions.map((p) => p.symbol));

    const ctx: CalcContext = {
      trades,
      positions,
      prices,
      today: new Date()
    };
    return runAll(ctx);
  });

  if (!data) return <p>Loading…</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4">
      {data.map((m) => (
        <Card key={m.id} title={m.label} value={m.value} />
      ))}
    </div>
  );
}

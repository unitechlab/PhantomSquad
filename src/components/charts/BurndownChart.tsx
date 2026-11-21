'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationResult } from '@/types';
import { useL10n } from '@/hooks/useL10n';

interface BurndownChartProps {
  result: SimulationResult;
  deadline: string;
}

export function BurndownChart({ result, deadline }: BurndownChartProps): JSX.Element {
  const { t } = useL10n();
  const data = result.dailyBurndown.map((d) => ({
    date: d.date,
    before: d.date <= deadline ? Number(d.remainingWorkload.toFixed(1)) : null,
    after: d.date >= deadline ? Number(d.remainingWorkload.toFixed(1)) : null,
  }));
  const tick = { fill: 'var(--color-ash)', fontSize: 12 };
  return (
    <div
      role="img"
      aria-label={t('chart.aria', { date: result.estimatedCompletionDate, deadline })}
      className="h-72 w-full rounded-md bg-crypt p-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--color-ash)" strokeOpacity={0.2} />
          <XAxis dataKey="date" tick={tick} minTickGap={32} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={tick} width={40} />
          <Tooltip
            contentStyle={{ background: 'var(--color-shadow)', border: 'none', color: 'var(--color-bone)' }}
          />
          <ReferenceLine
            x={deadline}
            stroke="var(--color-crimson)"
            strokeDasharray="6 4"
            label={{ value: t('chart.deadline'), fill: 'var(--color-ash)', fontSize: 12, position: 'insideTopRight' }}
          />
          <Line type="monotone" dataKey="before" stroke="var(--color-ecto)" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="after" stroke="var(--color-crimson)" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
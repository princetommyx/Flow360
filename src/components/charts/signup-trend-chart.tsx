'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { formatNumber } from '@/lib/money';
import type { SignupPoint } from '@/server/services/platform';

const AXIS_STYLE = { fontSize: 11, fill: 'var(--muted-foreground)' } as const;

/** Sign-ups a month at a time. Counts, so no currency anywhere near it. */
export function SignupTrendChart({ points }: { points: SignupPoint[] }) {
  return (
    <div className="h-[14rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            minTickGap={16}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_STYLE}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            content={<ChartTooltip formatter={(value) => formatNumber(value)} />}
          />
          <Bar
            dataKey="signups"
            name="New workspaces"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={34}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

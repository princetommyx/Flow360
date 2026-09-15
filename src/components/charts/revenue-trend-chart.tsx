'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { ChartLegend } from '@/components/charts/chart-legend';
import { formatCurrency } from '@/lib/money';
import type { TrendPoint } from '@/server/services/dashboard';

const AXIS_STYLE = {
  fontSize: 11,
  fill: 'var(--muted-foreground)',
} as const;

/**
 * Revenue against expenses over the selected period.
 *
 * Both series share one y-axis (money) — never a second scale — so the gap
 * between the bands reads directly as profit.
 */
export function RevenueTrendChart({
  data,
  currency,
}: {
  data: TrendPoint[];
  currency: string;
}) {
  return (
    <div>
      <ChartLegend
        className="mb-3"
        entries={[
          { label: 'Revenue', color: 'var(--chart-1)' },
          { label: 'Expenses', color: 'var(--chart-3)' },
        ]}
      />
      <div className="h-[16rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={AXIS_STYLE}
              minTickGap={24}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={AXIS_STYLE}
              width={64}
              tickFormatter={(value: number) => formatCurrency(value, { compact: true, currency })}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
              content={<ChartTooltip currency={currency} />}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#revenueFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--chart-3)"
              strokeWidth={2}
              fill="url(#expenseFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

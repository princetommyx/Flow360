'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { formatCurrency } from '@/lib/money';
import { statusMeta } from '@/lib/status';
import type { StatusSlice } from '@/server/services/dashboard';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'var(--muted-foreground)',
  SENT: 'var(--chart-6)',
  VIEWED: 'var(--chart-6)',
  PARTIALLY_PAID: 'var(--chart-3)',
  PAID: 'var(--chart-5)',
  OVERDUE: 'var(--destructive)',
  CANCELLED: 'var(--border-strong)',
};

/**
 * Invoiced value by status.
 *
 * Colour here is *status*, not a categorical series, so it reuses the reserved
 * state palette and every bar is labelled on the axis.
 */
export function SalesOverviewChart({ data }: { data: StatusSlice[] }) {
  const rows = data.map((slice) => ({
    ...slice,
    label: statusMeta(slice.status).label,
    fill: STATUS_COLOR[slice.status] ?? 'var(--chart-1)',
  }));

  return (
    <div className="h-[16rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            interval={0}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
          />
          <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltip />} />
          <Bar
            dataKey="amount"
            name="Invoiced"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            // Recharts reads `fill` off each datum when the key matches.
            fill="var(--chart-1)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

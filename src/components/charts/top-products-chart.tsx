'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { formatCurrency } from '@/lib/money';
import { truncate } from '@/lib/utils';
import type { TopProduct } from '@/server/services/dashboard';

/** Ranked magnitudes read best horizontally — the labels stay horizontal too. */
export function TopProductsChart({
  data,
  currency,
}: {
  data: TopProduct[];
  currency: string;
}) {
  const rows = data.map((product) => ({
    ...product,
    shortName: truncate(product.name, 22),
  }));

  return (
    <div className="h-[16rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={(value: number) => formatCurrency(value, { compact: true, currency })}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tickLine={false}
            axisLine={false}
            width={128}
            tick={{ fontSize: 11.5, fill: 'var(--foreground)' }}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            content={<ChartTooltip currency={currency} />}
          />
          <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} barSize={16}>
            {rows.map((row) => (
              <Cell key={row.id} fill="var(--chart-1)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { ChartLegend } from '@/components/charts/chart-legend';
import { formatCurrency } from '@/lib/money';
import type { SeriesPoint } from '@/server/services/reports';

const AXIS_STYLE = { fontSize: 11, fill: 'var(--muted-foreground)' } as const;

export type Series = { key: string; label: string; color: string };

/**
 * The one chart every report uses.
 *
 * `SeriesPoint` carries its values in a nested object so the service can shape
 * any number of series; recharts wants them flat, so they are flattened here
 * rather than in four separate pages.
 */
export function ReportSeriesChart({
  points,
  series,
  currency,
  kind = 'area',
  height = '16rem',
}: {
  points: SeriesPoint[];
  series: Series[];
  currency: string;
  kind?: 'area' | 'bar';
  height?: string;
}) {
  const data = points.map((point) => ({ label: point.label, ...point.values }));

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
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
        cursor={
          kind === 'bar'
            ? { fill: 'var(--muted)', opacity: 0.5 }
            : { stroke: 'var(--border-strong)', strokeWidth: 1 }
        }
        content={<ChartTooltip currency={currency} />}
      />
    </>
  );

  return (
    <div>
      <ChartLegend
        className="mb-3"
        entries={series.map((item) => ({ label: item.label, color: item.color }))}
      />
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'bar' ? (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              {axes}
              {series.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
              ))}
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <defs>
                {series.map((item) => (
                  <linearGradient
                    key={item.key}
                    id={`fill-${item.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={item.color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              {axes}
              {series.map((item) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2}
                  fill={`url(#fill-${item.key})`}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

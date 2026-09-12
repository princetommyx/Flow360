import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  formatDistanceToNowStrict,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from 'date-fns';

import { locale } from '@/lib/config/brand';

export const DATE_RANGE_PRESETS = [
  'today',
  'week',
  'month',
  'quarter',
  'year',
  'custom',
] as const;

export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export type DateRange = { from: Date; to: Date };

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
  custom: 'Custom range',
};

export function resolveDateRange(
  preset: DateRangePreset,
  custom?: { from?: string | null; to?: string | null },
  now: Date = new Date(),
): DateRange {
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'quarter':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'year':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom': {
      const from = custom?.from ? new Date(custom.from) : subDays(now, 30);
      const to = custom?.to ? new Date(custom.to) : now;
      return {
        from: startOfDay(Number.isNaN(from.getTime()) ? subDays(now, 30) : from),
        to: endOfDay(Number.isNaN(to.getTime()) ? now : to),
      };
    }
    case 'month':
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

/** The equivalent window immediately before `preset`, for period-over-period deltas. */
export function previousDateRange(
  preset: DateRangePreset,
  current: DateRange,
): DateRange {
  switch (preset) {
    case 'today':
      return { from: subDays(current.from, 1), to: subDays(current.to, 1) };
    case 'week':
      return { from: subWeeks(current.from, 1), to: subWeeks(current.to, 1) };
    case 'quarter':
      return { from: subQuarters(current.from, 1), to: subQuarters(current.to, 1) };
    case 'year':
      return { from: subYears(current.from, 1), to: subYears(current.to, 1) };
    case 'custom': {
      const span = current.to.getTime() - current.from.getTime();
      return {
        from: new Date(current.from.getTime() - span),
        to: new Date(current.from.getTime() - 1),
      };
    }
    case 'month':
    default:
      return { from: subMonths(current.from, 1), to: subMonths(current.to, 1) };
  }
}

export function parsePreset(value: string | undefined | null): DateRangePreset {
  return DATE_RANGE_PRESETS.includes(value as DateRangePreset)
    ? (value as DateRangePreset)
    : 'month';
}

export function formatDate(value: Date | string | null | undefined, pattern?: string) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, pattern ?? locale.dateFormat);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, `${locale.dateFormat}, HH:mm`);
}

export function formatRelative(value: Date | string | null | undefined) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** `yyyy-MM-dd` — the value shape used by `<input type="date">`. */
export function toDateInput(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'yyyy-MM-dd');
}

export function daysOverdue(dueDate: Date, now = new Date()) {
  return Math.max(
    0,
    Math.floor((startOfDay(now).getTime() - startOfDay(dueDate).getTime()) / 86_400_000),
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { hasPermission } from '@/lib/permissions';
import { formatNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';
import { requirePermission } from '@/server/tenant';
import {
  attendanceTotals,
  registerForDate,
  summarise,
} from '@/server/services/attendance';

import { Register } from './register';

export const metadata: Metadata = { title: 'Attendance' };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const context = await requirePermission('attendance.view');

  // A date from the query string only counts if it is one.
  const requested = params.date ? new Date(params.date) : new Date();
  const date = Number.isNaN(requested.getTime()) ? new Date() : requested;
  const dateValue = toDateInput(date);

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  const [rows, monthly] = await Promise.all([
    registerForDate(context.organization.id, date),
    attendanceTotals(context.organization.id, monthStart, monthEnd),
  ]);

  const summary = summarise(rows);
  const canEdit = hasPermission(context.permissions, 'attendance.edit');
  const canExport = hasPermission(context.permissions, 'attendance.export');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Who turned up, when, and for how long."
        actions={canExport ? <ExportButton /> : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">In today</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-success">
            <CountUp value={summary.present + summary.late} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {summary.late > 0 ? `${summary.late} of them late` : 'Nobody late'}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Away</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.absent + summary.onLeave} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {summary.onLeave} on leave · {summary.absent} absent
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Not marked</p>
          <p
            className={
              summary.unmarked > 0
                ? 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-warning-foreground'
                : 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular'
            }
          >
            <CountUp value={summary.unmarked} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {summary.unmarked === 0 ? 'The day is complete' : 'Still to record'}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Hours logged
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.hours} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">On this day</p>
        </Card>
      </div>

      <Suspense fallback={null}>
        <Register date={dateValue} rows={rows} canEdit={canEdit} />
      </Suspense>

      {monthly.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">
              This month, by person
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {monthly.map((person) => (
                <li
                  key={person.employeeNumber}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{person.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {person.days} day{person.days === 1 ? '' : 's'} recorded
                      {person.absent > 0 ? ` · ${person.absent} absent` : ''}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold tabular">
                    {formatNumber(person.hours, 2)} h
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

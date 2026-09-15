import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DetailList } from '@/components/shared/detail-list';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { getEmployee } from '@/server/services/employees';

export const metadata: Metadata = { title: 'Employee' };

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('employees.view');

  const employee = await getEmployee(context.organization.id, id);
  if (!employee) notFound();

  const currency = employee.currency;
  const can = {
    edit: hasPermission(context.permissions, 'employees.edit'),
    payroll: hasPermission(context.permissions, 'payroll.create'),
  };

  const name = `${employee.firstName} ${employee.lastName}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={`${employee.position ?? 'No role recorded'} · ${employee.employeeNumber}`}
        meta={<StatusBadge status={employee.status} />}
        actions={
          <>
            {can.edit ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/employees/${employee.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            ) : null}
            {can.payroll && employee.status !== 'TERMINATED' ? (
              <Button size="sm" asChild>
                <Link href={`/payroll/new?employeeId=${employee.id}`}>
                  <Wallet /> Run a payslip
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Payslips</CardTitle>
              <CardDescription>The last twelve, newest first.</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.payrolls.length === 0 ? (
                <p className="text-[13.5px] text-muted-foreground">
                  Nothing paid yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {employee.payrolls.map((payroll) => (
                    <li key={payroll.id}>
                      <Link
                        href={`/payroll/${payroll.id}`}
                        className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2">
                            <span className="font-mono text-[12.5px] font-medium">
                              {payroll.number}
                            </span>
                            <StatusBadge status={payroll.status} size="sm" />
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatDate(payroll.periodStart)} to{' '}
                            {formatDate(payroll.periodEnd)}
                          </p>
                        </div>
                        <span className="text-[13px] font-semibold tabular">
                          {formatCurrency(toNumber(payroll.netSalary), { currency })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Recent attendance</CardTitle>
              <CardDescription>The last thirty days recorded.</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.attendances.length === 0 ? (
                <p className="text-[13.5px] text-muted-foreground">
                  Nothing recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {employee.attendances.map((day) => (
                    <li
                      key={day.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] tabular">
                          {formatDate(day.date)}
                        </span>
                        <StatusBadge status={day.status} size="sm" />
                      </div>
                      <span className="text-[12.5px] text-muted-foreground tabular">
                        {toNumber(day.hoursWorked) > 0
                          ? `${formatNumber(toNumber(day.hoursWorked), 2)} h`
                          : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Email', value: employee.email },
                  { label: 'Phone', value: employee.phone ?? '—' },
                  {
                    label: 'Address',
                    value:
                      [employee.addressLine1, employee.city, employee.country]
                        .filter(Boolean)
                        .join(', ') || '—',
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Employment</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Department', value: employee.department ?? '—' },
                  {
                    label: 'Type',
                    value: TYPE_LABELS[employee.employmentType] ?? employee.employmentType,
                  },
                  { label: 'Started', value: formatDate(employee.hiredAt) },
                  ...(employee.terminatedAt
                    ? [{ label: 'Left', value: formatDate(employee.terminatedAt) }]
                    : []),
                  {
                    label: 'Base pay',
                    value: formatCurrency(toNumber(employee.baseSalary), { currency }),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Pay details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Account', value: employee.bankAccount ?? '—' },
                  { label: 'Tax number', value: employee.taxNumber ?? '—' },
                ]}
              />
            </CardContent>
          </Card>

          {employee.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                  {employee.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

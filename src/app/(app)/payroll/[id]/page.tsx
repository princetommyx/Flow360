import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DetailList } from '@/components/shared/detail-list';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { db } from '@/lib/db';
import { calculatePayslip, formatCurrency, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { getPayroll } from '@/server/services/payroll';

import { ApprovePayslip } from './approve-payslip';
import { PayPayslip } from './pay-payslip';

export const metadata: Metadata = { title: 'Payslip' };

export default async function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('payroll.view');

  const payroll = await getPayroll(context.organization.id, id);
  if (!payroll) notFound();

  const accounts = await db.account.findMany({
    where: { organizationId: context.organization.id, deletedAt: null, isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });

  const currency = payroll.currency;
  const canEdit = hasPermission(context.permissions, 'payroll.edit');

  const totals = calculatePayslip({
    baseSalary: toNumber(payroll.baseSalary),
    allowances: toNumber(payroll.allowances),
    overtime: toNumber(payroll.overtime),
    bonus: toNumber(payroll.bonus),
    taxDeduction: toNumber(payroll.taxDeduction),
    otherDeduction: toNumber(payroll.otherDeduction),
  });

  const name = `${payroll.employee.firstName} ${payroll.employee.lastName}`;

  const line = (label: string, value: number, muted = false) =>
    value === 0 && muted ? null : (
      <div className="flex justify-between gap-4">
        <dt className={muted ? 'text-muted-foreground' : ''}>{label}</dt>
        <dd className="tabular">{formatCurrency(value, { currency })}</dd>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={payroll.number}
        description={`${name} · ${formatDate(payroll.periodStart)} to ${formatDate(payroll.periodEnd)}`}
        meta={<StatusBadge status={payroll.status} />}
        actions={
          canEdit && payroll.status === 'DRAFT' ? (
            <>
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/payroll/${payroll.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
              <ApprovePayslip payrollId={payroll.id} />
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">The payslip</CardTitle>
              <CardDescription>
                Take-home is worked out from these figures, not stored separately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5 text-[13.5px]">
                {line('Base pay', toNumber(payroll.baseSalary))}
                {line('Allowances', toNumber(payroll.allowances), true)}
                {line('Overtime', toNumber(payroll.overtime), true)}
                {line('Bonus', toNumber(payroll.bonus), true)}
                <Separator />
                <div className="flex justify-between gap-4">
                  <dt className="font-medium">Gross pay</dt>
                  <dd className="font-medium tabular">
                    {formatCurrency(totals.gross, { currency })}
                  </dd>
                </div>
                {line('Tax', toNumber(payroll.taxDeduction), true)}
                {line('Other deductions', toNumber(payroll.otherDeduction), true)}
              </dl>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-[13.5px] font-medium">Take-home</span>
                <span className="text-2xl font-semibold tracking-[-0.02em] tabular">
                  {formatCurrency(totals.net, { currency })}
                </span>
              </div>
            </CardContent>
          </Card>

          {canEdit && payroll.status === 'APPROVED' ? (
            <PayPayslip
              payrollId={payroll.id}
              net={totals.net}
              currency={currency}
              accounts={accounts}
            />
          ) : null}

          {payroll.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                  {payroll.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Name', value: name },
                  { label: 'Number', value: payroll.employee.employeeNumber },
                  { label: 'Role', value: payroll.employee.position ?? '—' },
                  { label: 'Department', value: payroll.employee.department ?? '—' },
                  { label: 'Paid into', value: payroll.employee.bankAccount ?? '—' },
                  { label: 'Tax number', value: payroll.employee.taxNumber ?? '—' },
                ]}
              />
              <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
                <Link href={`/employees/${payroll.employee.id}`}>View their record</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Period</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'From', value: formatDate(payroll.periodStart) },
                  { label: 'To', value: formatDate(payroll.periodEnd) },
                  {
                    label: 'Paid',
                    value: payroll.paidAt ? formatDate(payroll.paidAt) : 'Not yet',
                  },
                  { label: 'Currency', value: payroll.currency },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

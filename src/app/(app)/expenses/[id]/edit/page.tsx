import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { locale } from '@/lib/config/brand';
import { toNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';
import { requirePermission } from '@/server/tenant';
import { expenseCategoryOptions, getExpense } from '@/server/services/expenses';
import { supplierOptions } from '@/server/services/suppliers';

import { ExpenseForm } from '../../expense-form';

export const metadata: Metadata = { title: 'Edit expense' };

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('expenses.edit');

  const expense = await getExpense(context.organization.id, id);
  if (!expense) notFound();

  const [categories, suppliers, accounts, settings] = await Promise.all([
    expenseCategoryOptions(context.organization.id),
    supplierOptions(context.organization.id),
    db.account.findMany({
      where: { organizationId: context.organization.id, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { taxLabel: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${expense.number}`} description={expense.title} />
      <ExpenseForm
        expenseId={expense.id}
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
        currency={expense.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        defaultValues={{
          title: expense.title,
          description: expense.description ?? '',
          categoryId: expense.categoryId,
          supplierId: expense.supplierId,
          accountId: expense.accountId,
          vendorName: expense.vendorName ?? '',
          amount: toNumber(expense.amount),
          taxAmount: toNumber(expense.taxAmount),
          method: expense.method,
          status: expense.status,
          spentAt: toDateInput(expense.spentAt),
          reference: expense.reference ?? '',
          billable: expense.billable,
        }}
      />
    </div>
  );
}

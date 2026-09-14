import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { locale } from '@/lib/config/brand';
import { requirePermission } from '@/server/tenant';
import { expenseCategoryOptions } from '@/server/services/expenses';
import { supplierOptions } from '@/server/services/suppliers';

import { ExpenseForm } from '../expense-form';

export const metadata: Metadata = { title: 'Record expense' };

export default async function NewExpensePage() {
  const context = await requirePermission('expenses.create');

  const [categories, suppliers, accounts, settings] = await Promise.all([
    expenseCategoryOptions(context.organization.id),
    supplierOptions(context.organization.id),
    db.account.findMany({
      where: { organizationId: context.organization.id, deletedAt: null, isActive: true },
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
      <PageHeader
        title="Record expense"
        description="Only a description, amount and date are required."
      />
      <ExpenseForm
        categories={categories}
        suppliers={suppliers}
        accounts={accounts}
        currency={context.organization.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
      />
    </div>
  );
}

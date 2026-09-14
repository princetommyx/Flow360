import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { CountUp } from '@/components/shared/count-up';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listAccounts } from '@/server/services/accounts';

import { AccountsManager } from './accounts-manager';

export const metadata: Metadata = { title: 'Accounts' };

export default async function AccountsPage() {
  const context = await requirePermission('accounts.view');
  const currency = context.organization.currency;

  const { rows, totalBalance } = await listAccounts(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Where your money sits, and what is in each place right now."
      />

      <Card className="hover-lift p-5">
        <p className="text-[12.5px] font-medium text-muted-foreground">
          Total across active accounts
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.025em] tabular">
          <CountUp value={totalBalance} kind="currency" currency={currency} decimals={2} />
        </p>
      </Card>

      <AccountsManager
        rows={rows}
        currency={currency}
        can={{
          create: hasPermission(context.permissions, 'accounts.create'),
          edit: hasPermission(context.permissions, 'accounts.edit'),
          delete: hasPermission(context.permissions, 'accounts.delete'),
        }}
      />
    </div>
  );
}

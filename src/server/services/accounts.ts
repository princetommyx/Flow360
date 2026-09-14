import 'server-only';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';

export type AccountRow = {
  id: string;
  name: string;
  type: string;
  bankName: string | null;
  accountNumber: string | null;
  currentBalance: number;
  openingBalance: number;
  isPrimary: boolean;
  isActive: boolean;
  transactionCount: number;
};

/**
 * Accounts are few by nature — a handful of bank, cash and mobile-money
 * balances — so the page shows all of them rather than paginating.
 */
export async function listAccounts(organizationId: string): Promise<{
  rows: AccountRow[];
  totalBalance: number;
}> {
  const accounts = await db.account.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: [{ isPrimary: 'desc' }, { isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      type: true,
      bankName: true,
      accountNumber: true,
      currentBalance: true,
      openingBalance: true,
      isPrimary: true,
      isActive: true,
      _count: { select: { transactions: true } },
    },
  });

  const rows = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    currentBalance: toNumber(account.currentBalance),
    openingBalance: toNumber(account.openingBalance),
    isPrimary: account.isPrimary,
    isActive: account.isActive,
    transactionCount: account._count.transactions,
  }));

  // Only live accounts count towards the headline: an archived one is not
  // money you can spend.
  const totalBalance = round(
    rows
      .filter((row) => row.isActive)
      .reduce((sum, row) => sum + row.currentBalance, 0),
  );

  return { rows, totalBalance };
}

export async function getAccount(organizationId: string, id: string) {
  return db.account.findFirst({ where: { id, organizationId, deletedAt: null } });
}

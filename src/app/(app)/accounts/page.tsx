import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Accounts" };

export default function Page() {
  return (
    <ModulePending
      title="Accounts"
      description="Bank, cash and card accounts with running balances."
      phase="Phase 3"
    />
  );
}

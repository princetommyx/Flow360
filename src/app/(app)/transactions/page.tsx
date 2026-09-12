import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Transactions" };

export default function Page() {
  return (
    <ModulePending
      title="Transactions"
      description="One ledger of every movement across your accounts."
      phase="Phase 3"
    />
  );
}

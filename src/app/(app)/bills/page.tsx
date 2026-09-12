import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Bills" };

export default function Page() {
  return (
    <ModulePending
      title="Bills"
      description="Supplier invoices and what you owe."
      phase="Phase 3"
    />
  );
}

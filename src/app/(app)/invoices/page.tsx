import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return (
    <ModulePending
      title="Invoices"
      description="Raise, send and track every invoice you issue."
      phase="Phase 2"
    />
  );
}

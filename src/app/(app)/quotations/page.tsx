import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Quotations" };

export default function Page() {
  return (
    <ModulePending
      title="Quotations"
      description="Win work with professional estimates that convert into invoices."
      phase="Phase 2"
    />
  );
}

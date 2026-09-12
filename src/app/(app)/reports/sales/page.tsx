import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Sales reports" };

export default function Page() {
  return (
    <ModulePending
      title="Sales reports"
      description="Revenue, invoices and customer performance."
      phase="Phase 5"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Tax settings" };

export default function Page() {
  return (
    <ModulePending
      title="Tax settings"
      description="Tax rates applied across quotes, invoices and purchases."
      phase="Phase 5"
    />
  );
}

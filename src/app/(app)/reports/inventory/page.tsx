import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Inventory reports" };

export default function Page() {
  return (
    <ModulePending
      title="Inventory reports"
      description="Stock movement, valuation and reorder pressure."
      phase="Phase 5"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Inventory" };

export default function Page() {
  return (
    <ModulePending
      title="Inventory"
      description="Live stock levels, movements and valuation."
      phase="Phase 3"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Suppliers" };

export default function Page() {
  return (
    <ModulePending
      title="Suppliers"
      description="Vendor records, terms and purchasing history."
      phase="Phase 3"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Expenses" };

export default function Page() {
  return (
    <ModulePending
      title="Expenses"
      description="Capture spend with categories, receipts and payment methods."
      phase="Phase 3"
    />
  );
}

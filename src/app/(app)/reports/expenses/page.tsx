import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Expense reports" };

export default function Page() {
  return (
    <ModulePending
      title="Expense reports"
      description="Spend by category, supplier and period."
      phase="Phase 5"
    />
  );
}

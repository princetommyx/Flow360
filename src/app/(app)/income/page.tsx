import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Income" };

export default function Page() {
  return (
    <ModulePending
      title="Income"
      description="Money received outside of invoicing."
      phase="Phase 3"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Financial reports" };

export default function Page() {
  return (
    <ModulePending
      title="Financial reports"
      description="Profit and loss, cash position and account activity."
      phase="Phase 5"
    />
  );
}

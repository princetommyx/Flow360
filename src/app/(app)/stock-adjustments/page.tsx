import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Stock adjustments" };

export default function Page() {
  return (
    <ModulePending
      title="Stock adjustments"
      description="Record stock in, stock out and corrections after a count."
      phase="Phase 3"
    />
  );
}

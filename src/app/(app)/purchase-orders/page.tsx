import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Purchase orders" };

export default function Page() {
  return (
    <ModulePending
      title="Purchase orders"
      description="Order stock from suppliers and receive it into inventory."
      phase="Phase 3"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return (
    <ModulePending
      title="Payments"
      description="Record money received from customers and paid to suppliers."
      phase="Phase 2"
    />
  );
}

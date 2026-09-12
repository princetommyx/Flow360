import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return (
    <ModulePending
      title="Customers"
      description="Your CRM: contacts, balances and full trading history."
      phase="Phase 2"
    />
  );
}

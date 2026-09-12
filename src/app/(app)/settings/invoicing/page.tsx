import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Invoice settings" };

export default function Page() {
  return (
    <ModulePending
      title="Invoice settings"
      description="Numbering, payment terms, notes and payment instructions."
      phase="Phase 5"
    />
  );
}

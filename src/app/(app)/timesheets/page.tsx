import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Timesheets" };

export default function Page() {
  return (
    <ModulePending
      title="Timesheets"
      description="Logged hours, billable and non-billable."
      phase="Phase 4"
    />
  );
}

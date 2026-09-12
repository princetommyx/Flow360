import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Attendance" };

export default function Page() {
  return (
    <ModulePending
      title="Attendance"
      description="Daily attendance and hours worked."
      phase="Phase 4"
    />
  );
}

import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Employees" };

export default function Page() {
  return (
    <ModulePending
      title="Employees"
      description="Your team: roles, departments and employment details."
      phase="Phase 4"
    />
  );
}

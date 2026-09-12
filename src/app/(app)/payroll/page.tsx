import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Payroll" };

export default function Page() {
  return (
    <ModulePending
      title="Payroll"
      description="Run pay periods with allowances, deductions and net pay."
      phase="Phase 4"
    />
  );
}

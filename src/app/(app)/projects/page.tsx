import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <ModulePending
      title="Projects"
      description="Budgets, teams and profitability per engagement."
      phase="Phase 4"
    />
  );
}

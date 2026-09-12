import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return (
    <ModulePending
      title="Tasks"
      description="Work items across every project, with owners and due dates."
      phase="Phase 4"
    />
  );
}

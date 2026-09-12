import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return (
    <ModulePending
      title="Users"
      description="Invite teammates and manage their access."
      phase="Phase 5"
    />
  );
}

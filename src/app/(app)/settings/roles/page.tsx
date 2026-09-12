import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Roles & permissions" };

export default function Page() {
  return (
    <ModulePending
      title="Roles & permissions"
      description="Fine-grained control over who can view, create, edit, delete and export."
      phase="Phase 5"
    />
  );
}

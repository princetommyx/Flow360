import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Categories" };

export default function Page() {
  return (
    <ModulePending
      title="Categories"
      description="Organise your catalogue for faster quoting and reporting."
      phase="Phase 2"
    />
  );
}

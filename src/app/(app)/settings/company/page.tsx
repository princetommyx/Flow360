import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Company settings" };

export default function Page() {
  return (
    <ModulePending
      title="Company settings"
      description="Company profile, branding, branches and locale."
      phase="Phase 5"
    />
  );
}

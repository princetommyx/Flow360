import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <ModulePending
      title="Notifications"
      description="Everything that needs your attention, in one inbox."
      phase="Phase 5"
    />
  );
}

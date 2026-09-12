import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Notification settings" };

export default function Page() {
  return (
    <ModulePending
      title="Notification settings"
      description="Choose which events generate an alert."
      phase="Phase 5"
    />
  );
}

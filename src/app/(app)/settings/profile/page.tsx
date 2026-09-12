import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "My profile" };

export default function Page() {
  return (
    <ModulePending
      title="My profile"
      description="Your personal details and password."
      phase="Phase 5"
    />
  );
}

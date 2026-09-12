import type { Metadata } from 'next';

import { ModulePending } from '@/components/shared/module-pending';

export const metadata: Metadata = { title: "Products & services" };

export default function Page() {
  return (
    <ModulePending
      title="Products & services"
      description="Everything you sell, with pricing, tax and stock settings."
      phase="Phase 2"
    />
  );
}

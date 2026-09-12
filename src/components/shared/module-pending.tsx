import Link from 'next/link';
import { Hammer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

/**
 * Honest placeholder for a module that is navigable but not yet implemented.
 * It is replaced by the real screen as each delivery phase lands — no
 * non-functional controls are shown in the meantime.
 */
export function ModulePending({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={Hammer}
          title={`${title} arrives in ${phase}`}
          description="This module is part of the build plan and is not available yet. Everything already shipped is fully working."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </Card>
    </div>
  );
}

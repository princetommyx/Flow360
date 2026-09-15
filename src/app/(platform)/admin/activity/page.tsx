import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateTime, formatRelative } from '@/lib/date';
import { requirePlatformAdmin } from '@/server/platform';
import { listPlatformAudit } from '@/server/services/platform';

export const metadata: Metadata = { title: 'Activity' };

const TONE: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'neutral'> = {
  'plan.set': 'success',
  'plan.decline': 'warning',
  'trial.extend': 'info',
  'organization.suspend': 'destructive',
  'organization.restore': 'success',
  'staff.grant': 'info',
  'staff.revoke': 'warning',
  'user.disable': 'destructive',
  'user.enable': 'success',
};

export default async function PlatformActivityPage() {
  await requirePlatformAdmin();
  const audit = await listPlatformAudit({ limit: 200 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Everything this console has changed, by whom and when. Append only: nothing here can be edited or removed, from the console or from a workspace."
      />

      <Card>
        <CardContent className="py-4">
          {audit.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Nothing changed yet"
              description="Approving a plan, extending a trial, suspending a workspace or granting operator access would each leave a line here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-start gap-3 py-3">
                  <Badge variant={TONE[entry.action] ?? 'neutral'} size="sm">
                    {entry.action}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug">{entry.summary}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {entry.actor} · {formatDateTime(entry.createdAt)} ·{' '}
                      {formatRelative(entry.createdAt)}
                    </p>
                  </div>
                  {entry.targetType === 'organization' ? (
                    <Link
                      href={`/admin/organizations/${entry.targetId}`}
                      className="shrink-0 text-[12.5px] font-medium text-primary hover:underline"
                    >
                      Open workspace
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

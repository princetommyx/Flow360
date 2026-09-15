import type { Metadata } from 'next';
import Link from 'next/link';
import { Inbox } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { PLATFORM_CURRENCY } from '@/lib/config/plans';
import { requirePlatformAdmin } from '@/server/platform';
import { listPlanRequests } from '@/server/services/platform';

import { RequestRow } from './request-row';

export const metadata: Metadata = { title: 'Plan requests' };

export default async function PlanRequestsPage() {
  await requirePlatformAdmin();
  const requests = await listPlanRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan requests"
        description="Owners who have asked to move on to a paid plan. Online payment is not switched on, so each of these is a conversation and a decision."
      />

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-4">
            <EmptyState
              icon={Inbox}
              title="Nothing waiting"
              description="A request raised from a workspace's billing page appears here straight away."
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {requests.map((request) => (
            <li key={request.organizationId}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/organizations/${request.organizationId}`}
                        className="text-[15px] font-semibold hover:underline"
                      >
                        {request.organizationName}
                      </Link>
                      <Badge variant="neutral" size="sm">
                        On {request.currentPlanLabel}
                      </Badge>
                      <Badge variant="info" size="sm">
                        Wants {request.requestedPlanLabel}
                      </Badge>
                    </div>

                    <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                      {request.owner
                        ? `${request.owner.name} · ${request.owner.email}`
                        : 'No owner on record'}
                      {request.trialEndsAt
                        ? ` · trial ends ${formatDate(request.trialEndsAt)}`
                        : ''}
                    </p>

                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      {request.billing === 'annual' ? 'Yearly' : 'Monthly'} ·{' '}
                      {request.price === null
                        ? 'Priced with them'
                        : `${formatCurrency(request.price, { currency: PLATFORM_CURRENCY })} ${
                            request.billing === 'annual' ? 'a year' : 'a month'
                          }`}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <RequestRow
                      organizationId={request.organizationId}
                      organizationName={request.organizationName}
                      plan={request.requestedPlan}
                      planLabel={request.requestedPlanLabel}
                      billing={request.billing === 'annual' ? 'annual' : 'monthly'}
                    />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/organizations/${request.organizationId}`}>
                        Open workspace
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

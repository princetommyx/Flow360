import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquarePlus, PlugZap, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { TimeAgo } from '@/components/shared/time-ago';
import { assistantEnabled } from '@/lib/config/assistant';
import { brand } from '@/lib/config/brand';
import { cn } from '@/lib/utils';
import { requireTenant } from '@/server/tenant';
import { getConversation, listConversations, type Turn } from '@/server/services/assistant';

import { AssistantChat } from './assistant-chat';

export const metadata: Metadata = { title: 'Assistant' };

/**
 * Openers, chosen for what they prove rather than what they show off: one
 * question it answers from the books, one that drafts something, one that
 * crosses two modules. Narrowed to what this person's role can actually reach,
 * so nothing here is a button that fails.
 */
function suggestionsFor(permissions: readonly string[]): string[] {
  const can = (key: string) => permissions.includes('*') || permissions.includes(key);

  return [
    can('invoices.view') ? 'Who owes me money, and how overdue is it?' : null,
    can('invoices.create') ? 'Draft an invoice for my biggest customer for 3 of my best seller' : null,
    can('products.view') ? 'What am I running low on?' : null,
    can('employees.view') ? 'Who is on the payroll and what does it come to each month?' : null,
  ].filter((item): item is string => item !== null);
}

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const context = await requireTenant();
  const params = await searchParams;

  /*
    Built, but not switched on. Deliberately not the "coming in a later phase"
    screen: nothing here is unfinished, it is unconfigured, and telling somebody
    to wait for a release that has already happened would be a lie.
  */
  if (!assistantEnabled()) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assistant"
          description="Ask about your business in plain words, and have it draft the work."
        />
        <Card>
          <EmptyState
            icon={PlugZap}
            title="The assistant is not switched on here"
            description={`It needs an Anthropic API key on this deployment before it can answer anything. Until there is one it stays quiet rather than pretending to work. Whoever set ${brand.name} up can add it — see docs/ASSISTANT.md.`}
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard">Back to the dashboard</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const conversations = await listConversations(context.organization.id, context.user.id);

  const active = params.c
    ? await getConversation(context.organization.id, context.user.id, params.c)
    : null;

  const turns: Turn[] = active?.turns ?? [];

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-0 flex-col gap-4 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="flex items-center justify-between gap-2 lg:block">
          <Button asChild variant="secondary" size="sm" className="w-full justify-start">
            <Link href="/assistant">
              <MessageSquarePlus /> New conversation
            </Link>
          </Button>
        </div>

        {conversations.length > 0 ? (
          <nav
            aria-label="Past conversations"
            className="mt-3 hidden max-h-[60vh] space-y-0.5 overflow-y-auto scrollbar-thin lg:block"
          >
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/assistant?c=${conversation.id}`}
                className={cn(
                  'block rounded-lg px-2.5 py-2 text-[12.5px] leading-snug transition-colors',
                  conversation.id === active?.id
                    ? 'bg-surface-subtle font-medium'
                    : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                )}
              >
                <span className="line-clamp-2">{conversation.title}</span>
                <TimeAgo
                  value={conversation.updatedAt}
                  className="mt-0.5 block text-[11px] text-muted-foreground/80"
                />
              </Link>
            ))}
          </nav>
        ) : null}
      </aside>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <p className="truncate text-[13px] font-medium">
            {active?.title ?? `Ask about ${context.organization.name}`}
          </p>
        </div>

        <CardContent className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-0">
          <AssistantChat
            key={active?.id ?? 'new'}
            conversationId={active?.id ?? null}
            turns={turns}
            suggestions={suggestionsFor(context.permissions)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

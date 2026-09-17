import 'server-only';

import { db } from '@/lib/db';
import type { ProposalPreview } from '@/server/assistant/context';

/**
 * Reading a conversation back.
 *
 * What is stored is the provider's own content blocks, which is what the next
 * turn has to replay — but it is not what a person should be shown. This turns
 * one into the other: the text they said, the text it said, a line naming what
 * it looked at, and the drafts it produced, all in the order they happened.
 *
 * Proposals are interleaved by time rather than appended, so a draft sits under
 * the sentence that announced it instead of at the bottom of an hour of chat.
 */

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type Turn =
  | { kind: 'said'; id: string; at: string; text: string }
  | { kind: 'replied'; id: string; at: string; text: string; tools: string[] }
  | {
      kind: 'draft';
      id: string;
      at: string;
      preview: ProposalPreview;
      status: string;
      resultLabel: string | null;
      resultHref: string | null;
      error: string | null;
    };

type Block = { type: string; text?: string; name?: string; thinking?: string };

export async function listConversations(
  organizationId: string,
  userId: string,
  limit = 30,
): Promise<ConversationSummary[]> {
  const rows = await db.conversation.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: { id: true, title: true, updatedAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getConversation(
  organizationId: string,
  userId: string,
  id: string,
): Promise<{ id: string; title: string; turns: Turn[] } | null> {
  const conversation = await db.conversation.findFirst({
    where: { id, organizationId, userId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
      proposals: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          preview: true,
          status: true,
          resultLabel: true,
          resultHref: true,
          error: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) return null;

  const turns: Turn[] = [];

  for (const message of conversation.messages) {
    const blocks = Array.isArray(message.content) ? (message.content as Block[]) : [];
    const text = blocks
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('\n')
      .trim();

    if (message.role === 'user') {
      // A turn of tool results is bookkeeping between us and the model. It
      // carries no text and belongs nowhere on the screen.
      if (text) {
        turns.push({
          kind: 'said',
          id: message.id,
          at: message.createdAt.toISOString(),
          text,
        });
      }
      continue;
    }

    const tools = blocks
      .filter((block) => block.type === 'tool_use' && typeof block.name === 'string')
      .map((block) => block.name as string);

    if (text || tools.length > 0) {
      turns.push({
        kind: 'replied',
        id: message.id,
        at: message.createdAt.toISOString(),
        text,
        tools,
      });
    }
  }

  for (const proposal of conversation.proposals) {
    turns.push({
      kind: 'draft',
      id: proposal.id,
      at: proposal.createdAt.toISOString(),
      preview: proposal.preview as unknown as ProposalPreview,
      status: proposal.status,
      resultLabel: proposal.resultLabel,
      resultHref: proposal.resultHref,
      error: proposal.error,
    });
  }

  turns.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));

  return { id: conversation.id, title: conversation.title, turns };
}

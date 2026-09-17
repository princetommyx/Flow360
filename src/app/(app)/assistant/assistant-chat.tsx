'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ArrowUp, Check, Loader2, Sparkles, Square, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichText } from '@/components/assistant/rich-text';
import { ProposalCard, type ProposalState } from '@/components/assistant/proposal-card';
import { cn } from '@/lib/utils';
import { toolLabel } from '@/lib/assistant-labels';
import type { Turn } from '@/server/services/assistant';

/**
 * The conversation.
 *
 * It owns the whole list once it is on screen: the turns the server rendered,
 * plus everything that arrives on the stream. It deliberately does not refresh
 * from the server when a reply finishes — the server would hand back the same
 * turns it already has, and the answer would flicker as it was replaced by an
 * identical copy of itself.
 *
 * What the person sees while it works is the point of the streaming. A tool
 * call announces itself ("Reading the invoices") and the reasoning appears in
 * grey above the answer, so a turn that takes twenty seconds looks like work
 * rather than a hang.
 */

type LiveTool = { id: string; label: string; state: 'running' | 'done' | 'failed' };

type Item =
  | { kind: 'said'; id: string; text: string }
  | { kind: 'replied'; id: string; text: string; tools: string[] }
  | { kind: 'draft'; id: string; proposal: ProposalState };

function toItems(turns: Turn[]): Item[] {
  return turns.map((turn) =>
    turn.kind === 'draft'
      ? {
          kind: 'draft' as const,
          id: turn.id,
          proposal: {
            id: turn.id,
            preview: turn.preview,
            status: turn.status,
            resultLabel: turn.resultLabel,
            resultHref: turn.resultHref,
            error: turn.error,
          },
        }
      : turn.kind === 'said'
        ? { kind: 'said' as const, id: turn.id, text: turn.text }
        : { kind: 'replied' as const, id: turn.id, text: turn.text, tools: turn.tools },
  );
}

export function AssistantChat({
  conversationId,
  turns,
  suggestions,
}: {
  conversationId: string | null;
  turns: Turn[];
  suggestions: string[];
}) {
  const [items, setItems] = React.useState<Item[]>(() => toItems(turns));
  const [conversation, setConversation] = React.useState(conversationId);
  const [draft, setDraft] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const [thinking, setThinking] = React.useState('');
  const [tools, setTools] = React.useState<LiveTool[]>([]);
  const [failure, setFailure] = React.useState<string | null>(null);

  const abort = React.useRef<AbortController | null>(null);
  const bottom = React.useRef<HTMLDivElement>(null);
  const box = React.useRef<HTMLTextAreaElement>(null);

  /*
    There is no effect resetting this when the conversation changes, because
    the page gives this component a `key` of the conversation id. Switching
    conversation remounts it, which is React's own answer to "reset all the
    state" and the one that cannot be half-applied.
  */

  React.useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [items, streamText, thinking, tools]);

  function settle(id: string, next: Partial<ProposalState>) {
    setItems((current) =>
      current.map((item) =>
        item.kind === 'draft' && item.id === id
          ? { ...item, proposal: { ...item.proposal, ...next } }
          : item,
      ),
    );
  }

  async function send(message: string) {
    const text = message.trim();
    if (!text || busy) return;

    setDraft('');
    setFailure(null);
    setItems((current) => [...current, { kind: 'said', id: `said-${Date.now()}`, text }]);
    setBusy(true);
    setStreamText('');
    setThinking('');
    setTools([]);

    const controller = new AbortController();
    abort.current = controller;

    let answer = '';
    const drafted: Item[] = [];
    const used: string[] = [];

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation, message: text }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.error ?? 'The assistant could not be reached.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Whatever follows the last newline is half an event; keep it.
        buffer = lines.pop() ?? '';

        for (const raw of lines) {
          if (!raw.trim()) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          switch (event.type) {
            case 'conversation':
              if (event.id !== conversation) {
                setConversation(event.id as string);
                /*
                  Put the new conversation in the address bar without going
                  through the router. A navigation would change this
                  component's `key` and remount it mid-answer, throwing away
                  the reply as it arrives; this only means a reload lands back
                  on the same conversation instead of an empty one.
                */
                window.history.replaceState(null, '', `/assistant?c=${event.id as string}`);
              }
              break;
            case 'thinking':
              setThinking((current) => current + (event.text as string));
              break;
            case 'text':
              answer += event.text as string;
              setStreamText(answer);
              break;
            case 'tool': {
              const tool = event as unknown as LiveTool & { name: string };
              if (tool.state === 'running') used.push(tool.name);
              setTools((current) => {
                const rest = current.filter((row) => row.id !== tool.id);
                return [...rest, { id: tool.id, label: tool.label, state: tool.state }];
              });
              break;
            }
            case 'proposal':
              drafted.push({
                kind: 'draft',
                id: event.id as string,
                proposal: {
                  id: event.id as string,
                  preview: event.preview as ProposalState['preview'],
                  status: 'pending',
                  resultLabel: null,
                  resultHref: null,
                  error: null,
                },
              });
              break;
            case 'error':
              setFailure(event.message as string);
              break;
            default:
              break;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setFailure((error as Error).message || 'Something went wrong.');
      }
    } finally {
      abort.current = null;
      setBusy(false);
      setThinking('');
      setTools([]);
      setStreamText('');

      setItems((current) => [
        ...current,
        ...(answer.trim()
          ? [{ kind: 'replied' as const, id: `replied-${Date.now()}`, text: answer, tools: used }]
          : []),
        ...drafted,
      ]);

      /*
        No `router.refresh()` here, though the sidebar would like one.

        The page keys this component on the conversation in the URL, so that
        switching conversations resets it. A refresh re-runs the server
        component, which now sees the id this turn just put in the address bar,
        which changes the key — and the reply the person is reading is thrown
        away and rebuilt from the server mid-sentence. The sidebar catches up on
        the next navigation instead; a list being one entry behind is worth less
        than an answer that stays put.
      */
    }
  }

  function stop() {
    abort.current?.abort();
    toast.info('Stopped.');
  }

  const empty = items.length === 0 && !busy;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto w-full max-w-3xl space-y-5 px-1 py-4">
          {empty ? (
            <div className="py-8 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.02em]">
                Ask about your business
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-pretty text-[13px] leading-relaxed text-muted-foreground">
                It reads this workspace and answers from what is actually in it. It can
                draft invoices, quotations and payslips too — you see the draft and decide.
              </p>

              <div className="mx-auto mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-lg border border-border px-3 py-2.5 text-left text-[12.5px] leading-relaxed transition-colors hover:bg-surface-subtle"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {items.map((item) => {
            if (item.kind === 'said') {
              return (
                <div key={item.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-[13.5px] leading-relaxed text-primary-foreground">
                    {item.text}
                  </p>
                </div>
              );
            }

            if (item.kind === 'draft') {
              return <ProposalCard key={item.id} proposal={item.proposal} onSettled={settle} />;
            }

            return (
              <div key={item.id} className="space-y-2">
                {item.tools.length > 0 ? <ToolTrace names={item.tools} /> : null}
                {item.text ? <RichText text={item.text} /> : null}
              </div>
            );
          })}

          {thinking && !streamText ? (
            <p className="whitespace-pre-wrap border-l-2 border-border pl-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {thinking}
            </p>
          ) : null}

          {tools.length > 0 ? (
            <ul className="space-y-1">
              {tools.map((tool) => (
                <li
                  key={tool.id}
                  className="flex items-center gap-2 text-[12.5px] text-muted-foreground"
                >
                  {tool.state === 'running' ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : tool.state === 'failed' ? (
                    <TriangleAlert className="size-3.5 text-warning" aria-hidden />
                  ) : (
                    <Check className="size-3.5 text-success" aria-hidden />
                  )}
                  {tool.label}
                </li>
              ))}
            </ul>
          ) : null}

          {streamText ? <RichText text={streamText} /> : null}

          {busy && !streamText && !thinking && tools.length === 0 ? (
            <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Thinking
            </p>
          ) : null}

          {failure ? (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft/40 px-3 py-2.5 text-[12.5px] leading-relaxed">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
              <span>{failure}</span>
            </p>
          ) : null}

          <div ref={bottom} />
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <form
          className="mx-auto w-full max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2 focus-within:border-border-strong">
            <Textarea
              ref={box}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              rows={1}
              placeholder="Ask about your customers, invoices, stock or staff…"
              aria-label="Message the assistant"
              className={cn(
                'max-h-40 min-h-9 resize-none border-0 bg-transparent px-1.5 py-1.5 shadow-none',
                'focus-visible:ring-0',
              )}
            />
            {busy ? (
              <Button type="button" size="icon" variant="secondary" onClick={stop} aria-label="Stop">
                <Square />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send">
                <ArrowUp />
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-center text-[11.5px] text-muted-foreground">
            It can be wrong. Nothing is created, changed or paid until you press the button on a
            draft.
          </p>
        </form>
      </div>
    </div>
  );
}

/**
 * What a finished reply went through, in the same words the live stream used —
 * "Reading the invoices", not "list_invoices". Deduplicated, because a reply
 * that looked up four customers looked up customers once as far as anybody
 * reading this cares.
 */
function ToolTrace({ names }: { names: string[] }) {
  const labels = Array.from(new Set(names.map(toolLabel)));
  return <p className="text-[11.5px] text-muted-foreground">{labels.join(' · ')}</p>;
}

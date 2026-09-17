import { db } from '@/lib/db';
import { MAX_MESSAGE_CHARS, assistantEnabled } from '@/lib/config/assistant';
import { AuthorizationError, requireTenant } from '@/server/tenant';
import { runAssistant, type AssistantEvent } from '@/server/assistant/run';

/**
 * The assistant's turn, streamed to the browser.
 *
 * A route handler rather than a server action because this has to arrive a
 * word at a time. A reply can take half a minute when the model is reading
 * three tables to answer, and half a minute of nothing is indistinguishable
 * from a broken page.
 *
 * The wire format is one JSON object per line. Not Server-Sent Events: those
 * buy reconnection semantics this does not want — a half-finished answer should
 * not resume on its own — and cost a framing layer on both ends.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!assistantEnabled()) {
    return Response.json({ error: 'The assistant is not switched on here.' }, { status: 503 });
  }

  /*
    A server action gets an origin check from the framework; a route handler
    does not. Cookies are `SameSite=Lax`, which already stops a cross-site form
    post, and this is the second lock on the same door.

    The comparison is against the host the request actually arrived on, not
    against `NEXT_PUBLIC_APP_URL`. That variable is set by hand and is
    routinely wrong — `lib/url.ts` says so itself — and a custom domain, a
    preview deployment or a `www.` the configured value does not mention would
    each turn this lock on the people who live here. The host cannot be got
    wrong that way: it is what the browser connected to, and a page on another
    site cannot forge it while also claiming its own origin, which is the
    attack this is for.
  */
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Bad origin' }, { status: 403 });
  }

  let context;
  try {
    context = await requireTenant();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json({ error: 'Not allowed' }, { status: 403 });
    }
    // requireTenant redirects when there is no session; a fetch cannot follow
    // that usefully, so it reads as a 401 here.
    return Response.json({ error: 'Not signed in' }, { status: 401 });
  }

  let body: { conversationId?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Malformed request' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return Response.json({ error: 'Say something first.' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `That is longer than ${MAX_MESSAGE_CHARS} characters. Send it in pieces.` },
      { status: 400 },
    );
  }

  // An id from the browser is checked against this workspace and this person
  // before a word of history is read out of it.
  let conversationId: string | null = null;
  if (typeof body.conversationId === 'string' && body.conversationId) {
    const found = await db.conversation.findFirst({
      where: {
        id: body.conversationId,
        organizationId: context.organization.id,
        userId: context.user.id,
      },
      select: { id: true },
    });
    if (!found) return Response.json({ error: 'That conversation is gone.' }, { status: 404 });
    conversationId = found.id;
  }

  let created = false;
  if (!conversationId) {
    const conversation = await db.conversation.create({
      data: {
        organizationId: context.organization.id,
        userId: context.user.id,
        title: titleFrom(message),
      },
      select: { id: true },
    });
    conversationId = conversation.id;
    created = true;
  }

  const encoder = new TextEncoder();
  const line = (event: AssistantEvent | { type: 'conversation'; id: string }) =>
    encoder.encode(`${JSON.stringify(event)}\n`);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(line({ type: 'conversation', id: conversationId! }));
        if (created) {
          controller.enqueue(line({ type: 'title', title: titleFrom(message) }));
        }

        for await (const event of runAssistant({
          conversationId: conversationId!,
          organizationId: context.organization.id,
          organizationName: context.organization.name,
          currency: context.organization.currency,
          userId: context.user.id,
          userName: context.user.name,
          roleName: context.role.name,
          permissions: context.permissions,
          message,
        })) {
          controller.enqueue(line(event));
        }
      } catch (error) {
        console.error('Assistant stream broke', error);
        controller.enqueue(line({ type: 'error', message: 'The connection dropped mid-answer.' }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      // Stops a reverse proxy holding the whole reply back to buffer it.
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Whether this request came from a page on this deployment.
 *
 * A browser sets `Origin` on a cross-site POST and cannot be made to lie about
 * it, so an origin that disagrees with the host being addressed is the
 * signature of a request made from somewhere else. A missing `Origin` is not
 * that signature — same-origin requests from older clients omit it — and the
 * session cookie is `SameSite=Lax`, so it is let through rather than being a
 * second way to lock somebody out.
 *
 * `x-forwarded-host` is what a proxy that terminated TLS puts the real host in;
 * on Vercel the platform sets it, not the caller.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** The opening question, trimmed, so the list reads as a list of questions. */
function titleFrom(message: string): string {
  const flat = message.replace(/\s+/g, ' ').trim();
  return flat.length > 70 ? `${flat.slice(0, 69)}…` : flat;
}

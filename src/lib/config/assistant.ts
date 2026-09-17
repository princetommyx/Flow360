/**
 * The assistant, and what it is allowed to be.
 *
 * Off unless an API key is set, and the whole feature disappears rather than
 * showing a chat box that answers nothing. Everything else here is a ceiling
 * rather than a setting: a conversation that will not run away, a turn that
 * will not loop forever.
 */

/**
 * Gemini Flash by the moving alias rather than a pinned version.
 *
 * The alias is what Google keeps pointing at the current Flash model, and a
 * version pinned here would need a code change every time that moved. Pin it
 * with `GEMINI_MODEL` on a deployment that would rather decide for itself when
 * to take a new one.
 */
export const ASSISTANT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';

/**
 * `GEMINI_API_KEY` is the name Google's own tooling uses; `GOOGLE_API_KEY` is
 * accepted because half the documentation says that instead and a key that
 * silently does nothing is a bad hour.
 */
export function assistantKey(): string {
  return (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '').trim();
}

export function assistantEnabled(): boolean {
  return assistantKey().length > 0;
}

/**
 * Where the model lives, when it is not where Google keeps it.
 *
 * Unset in normal use. It exists so the assistant can be driven end to end
 * against a stand-in that speaks the same wire format — which is how the loop,
 * the tools and the drafts get tested without spending anything — and it is the
 * escape hatch for a deployment that has to route through a proxy of its own.
 */
export function assistantBaseUrl(): string | undefined {
  return process.env.GEMINI_BASE_URL?.trim() || undefined;
}

/** Turns of tool use inside one reply before we stop and say so. */
export const MAX_TOOL_ROUNDS = 8;

/** Messages of history replayed to the model. Older turns stay readable. */
export const MAX_HISTORY_MESSAGES = 40;

export const MAX_MESSAGE_CHARS = 4_000;

/** Output ceiling for one reply. Generous: the answer is usually a table. */
export const MAX_OUTPUT_TOKENS = 8_000;

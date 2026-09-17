/**
 * The assistant, and what it is allowed to be.
 *
 * Off unless an API key is set, and the whole feature disappears rather than
 * showing a chat box that answers nothing. Everything else here is a ceiling
 * rather than a setting: a conversation that will not run away, a turn that
 * will not loop forever.
 */

/**
 * Opus 5. The assistant reads a workspace's books and drafts documents against
 * them, and the cost of getting a customer or a figure wrong is higher than the
 * difference in price per token. Override it per deployment if that trade looks
 * different to you.
 */
export const ASSISTANT_MODEL = process.env.ANTHROPIC_MODEL?.trim() || 'claude-opus-5';

export function assistantKey(): string {
  return (process.env.ANTHROPIC_API_KEY ?? '').trim();
}

export function assistantEnabled(): boolean {
  return assistantKey().length > 0;
}

/** Turns of tool use inside one reply before we stop and say so. */
export const MAX_TOOL_ROUNDS = 8;

/** Messages of history replayed to the model. Older turns stay readable. */
export const MAX_HISTORY_MESSAGES = 40;

export const MAX_MESSAGE_CHARS = 4_000;

/** Output ceiling for one reply. Generous: the answer is usually a table. */
export const MAX_OUTPUT_TOKENS = 8_000;

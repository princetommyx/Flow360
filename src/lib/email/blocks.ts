/**
 * The pieces an email body can be made of.
 *
 * Templates describe *what* they want to say; `render.ts` decides how that
 * looks in HTML and in plain text. Keeping the two apart means a change to the
 * shell — a new footer, a different button colour — lands in one file rather
 * than in every message.
 */

export type MailBlock =
  /** A paragraph. */
  | { kind: 'text'; text: string }
  /** A one-time code, shown large enough to read off a phone. */
  | { kind: 'code'; code: string; caption?: string }
  /** Label/value pairs: a plan, a price, a renewal date. */
  | { kind: 'facts'; rows: Array<{ label: string; value: string }> }
  /** A short bulleted list. */
  | { kind: 'list'; items: string[] }
  /** A tinted aside — the thing to read if you read nothing else. */
  | { kind: 'callout'; text: string };

/** A plain string in a body is shorthand for a paragraph. */
export type MailBodyItem = string | MailBlock;

export const text = (value: string): MailBlock => ({ kind: 'text', text: value });

export const code = (value: string, caption?: string): MailBlock => ({
  kind: 'code',
  code: value,
  caption,
});

export const facts = (rows: Array<{ label: string; value: string }>): MailBlock => ({
  kind: 'facts',
  rows,
});

export const list = (items: string[]): MailBlock => ({ kind: 'list', items });

export const callout = (value: string): MailBlock => ({ kind: 'callout', text: value });

export function toBlock(item: MailBodyItem): MailBlock {
  return typeof item === 'string' ? text(item) : item;
}

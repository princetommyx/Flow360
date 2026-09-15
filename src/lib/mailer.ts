import { brand } from '@/lib/config/brand';
import { toBlock } from '@/lib/email/blocks';
import { renderHtml, renderText, type MailMessage } from '@/lib/email/render';

/**
 * Transactional email — the transport half.
 *
 * What each message *says* lives in `lib/email/templates.ts`; this file only
 * decides where it goes. Two transports: `console` is the default and prints
 * the message — codes and links included — to the server log, so every flow is
 * testable without an account anywhere. `resend` delivers over HTTPS, which is
 * what a serverless host can actually do: outbound SMTP ports are usually
 * closed, so an SMTP client would hang until it timed out.
 */

export type { MailMessage, MailAction } from '@/lib/email/render';

type Transport = 'console' | 'resend';

/**
 * Reads a setting the way it was probably pasted.
 *
 * A `.env` file quotes its values and the parser strips those quotes; a
 * hosting dashboard stores exactly what is in the box. Copying a line out of
 * `.env.example` therefore lands the quotes in the value, and `"resend"` is
 * not `resend` — the app silently keeps writing to the log while the console
 * shows the variable set, which is a miserable thing to debug.
 */
function setting(name: string): string {
  const raw = (process.env[name] ?? '').trim();

  // Only a *matched* surrounding pair counts. Stripping quotes one end at a
  // time would maul `"Adwuma360" <support@…>`, which is a legitimate From
  // header — the quotes there belong to the display name, not to the paste.
  const wrapped =
    raw.length >= 2 && (raw[0] === '"' || raw[0] === "'") && raw.at(-1) === raw[0];

  return (wrapped ? raw.slice(1, -1) : raw).trim();
}

function transport(): Transport {
  return setting('EMAIL_TRANSPORT').toLowerCase() === 'resend' ? 'resend' : 'console';
}

/**
 * Whether mail actually leaves the building.
 *
 * A transport named without its credential cannot deliver, so that counts as
 * not configured rather than as working. Screens that would otherwise tell
 * someone to go and check their inbox use this to say something true instead.
 */
export function mailIsDelivered(): boolean {
  return transport() === 'resend' && setting('RESEND_API_KEY') !== '';
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!mailIsDelivered()) {
    logToConsole(message);
    return;
  }

  await sendWithResend(message);
}

function logToConsole(message: MailMessage): void {
  const rule = '──────────────────────────────────────────────────────────';
  const lines = [
    '',
    rule,
    `✉  ${brand.name}: ${message.subject}`,
    `   to: ${message.to}`,
    rule,
    message.heading,
    '',
    ...message.body.map((item) => {
      const block = toBlock(item);
      switch (block.kind) {
        case 'code':
          return `    ${block.code}`;
        case 'facts':
          return block.rows.map((row) => `    ${row.label}: ${row.value}`).join('\n');
        case 'list':
          return block.items.map((entry) => `    • ${entry}`).join('\n');
        default:
          // 'text' and 'callout' both read as a plain paragraph in a log.
          return block.text;
      }
    }),
    message.action ? `\n${message.action.label}: ${message.action.url}` : '',
    rule,
    '',
  ];
  // eslint-disable-next-line no-console -- the console transport is the point
  console.info(lines.filter((line) => line !== '').join('\n'));
}

async function sendWithResend(message: MailMessage): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${setting('RESEND_API_KEY')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: setting('EMAIL_FROM') || `${brand.name} <onboarding@resend.dev>`,
      to: [message.to],
      subject: message.subject,
      html: renderHtml(message),
      text: renderText(message),
    }),
  });

  if (!response.ok) {
    // Surfaces the provider's own reason — an unverified sending domain and a
    // bad key fail identically from the outside otherwise.
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Resend rejected the message (${response.status}): ${detail.slice(0, 400)}`,
    );
  }
}

export { absoluteUrl } from '@/lib/url';

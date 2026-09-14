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

function transport(): Transport {
  const configured = (process.env.EMAIL_TRANSPORT ?? 'console').trim().toLowerCase();
  return configured === 'resend' ? 'resend' : 'console';
}

/**
 * Whether mail actually leaves the building.
 *
 * A transport named without its credential cannot deliver, so that counts as
 * not configured rather than as working. Screens that would otherwise tell
 * someone to go and check their inbox use this to say something true instead.
 */
export function mailIsDelivered(): boolean {
  return transport() === 'resend' && Boolean(process.env.RESEND_API_KEY?.trim());
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
    `✉  ${brand.name} — ${message.subject}`,
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
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM?.trim() || `${brand.name} <onboarding@resend.dev>`,
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

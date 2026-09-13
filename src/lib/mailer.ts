import { brand } from '@/lib/config/brand';

/**
 * Transactional email.
 *
 * Development uses the `console` transport, which prints the message (and any
 * verification link) to the server log so the flows are fully testable without
 * an SMTP account. Point EMAIL_TRANSPORT at a real provider in production by
 * implementing `sendWithProvider`.
 */

export type MailMessage = {
  to: string;
  subject: string;
  heading: string;
  body: string[];
  action?: { label: string; url: string };
};

export async function sendMail(message: MailMessage): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? 'console';

  if (transport === 'console') {
    const lines = [
      '',
      '──────────────────────────────────────────────────────────',
      `✉  ${brand.name} — ${message.subject}`,
      `   to: ${message.to}`,
      '──────────────────────────────────────────────────────────',
      message.heading,
      ...message.body,
      message.action ? `\n${message.action.label}: ${message.action.url}` : '',
      '──────────────────────────────────────────────────────────',
      '',
    ];
    // eslint-disable-next-line no-console -- the console transport is the point
    console.info(lines.filter(Boolean).join('\n'));
    return;
  }

  await sendWithProvider(message);
}

async function sendWithProvider(message: MailMessage): Promise<void> {
  throw new Error(
    `EMAIL_TRANSPORT="${process.env.EMAIL_TRANSPORT}" is not implemented yet (message: ${message.subject}).`,
  );
}

export { absoluteUrl } from '@/lib/url';

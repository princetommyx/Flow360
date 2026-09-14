import { brand } from '@/lib/config/brand';

/**
 * Transactional email.
 *
 * Two transports. `console` is the default and prints the message — including
 * any link — to the server log, so every flow is testable without an account
 * anywhere. `resend` delivers over HTTPS, which is what a serverless host can
 * actually do: outbound SMTP ports are usually closed, so an SMTP client would
 * hang until it timed out.
 */

export type MailMessage = {
  to: string;
  subject: string;
  heading: string;
  body: string[];
  action?: { label: string; url: string };
};

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

  await sendWithResend(message);
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderText(message: MailMessage): string {
  return [
    message.heading,
    '',
    ...message.body,
    message.action ? `\n${message.action.label}: ${message.action.url}` : '',
    '',
    `— ${brand.name}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

/**
 * Inline styles and a table wrapper, because that is what mail clients render
 * predictably — Gmail strips <style> blocks and Outlook ignores flexbox.
 */
function renderHtml(message: MailMessage): string {
  const accent = brand.colors.primary;

  const paragraphs = message.body
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f434d;">${escapeHtml(line)}</p>`,
    )
    .join('');

  const button = message.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:999px;background:${accent};">
           <a href="${escapeHtml(message.action.url)}"
              style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">
             ${escapeHtml(message.action.label)}
           </a>
         </td></tr>
       </table>
       <p style="margin:0 0 6px;font-size:12.5px;line-height:1.6;color:#6b7280;">
         If the button does not work, paste this into your browser:
       </p>
       <p style="margin:0;font-size:12.5px;line-height:1.6;word-break:break-all;">
         <a href="${escapeHtml(message.action.url)}" style="color:${accent};">${escapeHtml(message.action.url)}</a>
       </p>`
    : '';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border-radius:14px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td>
          <p style="margin:0 0 24px;font-size:17px;font-weight:700;letter-spacing:-0.01em;color:${accent};">
            ${escapeHtml(brand.name)}
          </p>
          <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:650;letter-spacing:-0.02em;color:#14161f;">
            ${escapeHtml(message.heading)}
          </h1>
          ${paragraphs}
          ${button}
          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e6e8ec;font-size:12px;line-height:1.6;color:#8b909a;">
            Sent by ${escapeHtml(brand.name)}. If you were not expecting this, you can ignore it safely.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export { absoluteUrl } from '@/lib/url';

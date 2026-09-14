import { brand, company } from '@/lib/config/brand';
import { absoluteUrl } from '@/lib/url';

import { toBlock, type MailBlock, type MailBodyItem } from './blocks';

export type MailAction = { label: string; url: string };

export type MailMessage = {
  to: string;
  subject: string;
  /**
   * The grey line an inbox shows next to the subject. Without one, clients
   * scrape the first thing they find — usually the logo's alt text.
   */
  preheader: string;
  heading: string;
  body: MailBodyItem[];
  action?: MailAction;
  /** A quieter second link under the button, e.g. "View your plan". */
  secondaryAction?: MailAction;
  /** Small print under the rule: expiry, "you can ignore this", and so on. */
  footnote?: string;
};

/*
  Everything below is inline-styled and table-based on purpose. Gmail strips
  <style> blocks, Outlook renders through Word and ignores flexbox and most of
  the box model, and no client can be relied on for anything newer. The palette
  is fixed rather than tokenised: email has no CSS variables.
*/
const INK = '#14161f';
const BODY_INK = '#3f434d';
const MUTED = '#6b7280';
const FAINT = '#8b909a';
const HAIRLINE = '#e6e8ec';
const PAGE = '#f4f5f7';
const CARD = '#ffffff';

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Tints a hex colour towards white — for the soft backgrounds behind blocks. */
function tint(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const channels = [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16));
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * amount),
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function accent(): string {
  return brand.colors.primary;
}

function companyAddress(): string {
  return [company.addressLine1, company.city, company.country]
    .filter(Boolean)
    .join(', ');
}

/* ── Blocks ──────────────────────────────────────────────────────────────── */

function renderBlock(block: MailBlock): string {
  switch (block.kind) {
    case 'text':
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:${BODY_INK};">${escapeHtml(block.text)}</p>`;

    case 'code':
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;">
          <tr>
            <td align="center" bgcolor="${tint(accent(), 0.94)}"
                style="border-radius:12px;border:1px solid ${tint(accent(), 0.82)};padding:20px 16px;">
              <div style="font-family:${MONO};font-size:31px;line-height:1.1;font-weight:700;letter-spacing:0.28em;color:${INK};">
                ${escapeHtml(block.code)}
              </div>
              ${
                block.caption
                  ? `<div style="margin-top:9px;font-family:${FONT};font-size:12.5px;line-height:1.5;color:${MUTED};">${escapeHtml(block.caption)}</div>`
                  : ''
              }
            </td>
          </tr>
        </table>`;

    case 'facts':
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="margin:4px 0 18px;border:1px solid ${HAIRLINE};border-radius:12px;">
          ${block.rows
            .map(
              (row, index) => `
          <tr>
            <td style="padding:12px 16px;font-size:13.5px;line-height:1.5;color:${MUTED};${
              index === 0 ? '' : `border-top:1px solid ${HAIRLINE};`
            }">${escapeHtml(row.label)}</td>
            <td align="right" style="padding:12px 16px;font-size:13.5px;line-height:1.5;font-weight:600;color:${INK};${
              index === 0 ? '' : `border-top:1px solid ${HAIRLINE};`
            }">${escapeHtml(row.value)}</td>
          </tr>`,
            )
            .join('')}
        </table>`;

    case 'list':
      // A table rather than <ul>: Outlook indents lists unpredictably.
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
          ${block.items
            .map(
              (item) => `
          <tr>
            <td width="18" valign="top" style="padding:0 0 9px;font-size:15px;line-height:1.62;color:${accent()};">&bull;</td>
            <td valign="top" style="padding:0 0 9px;font-size:15px;line-height:1.62;color:${BODY_INK};">${escapeHtml(item)}</td>
          </tr>`,
            )
            .join('')}
        </table>`;

    case 'callout':
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 18px;">
          <tr>
            <td bgcolor="${tint(accent(), 0.95)}"
                style="border-radius:10px;border-left:3px solid ${accent()};padding:13px 15px;font-size:14px;line-height:1.6;color:${BODY_INK};">
              ${escapeHtml(block.text)}
            </td>
          </tr>
        </table>`;
  }
}

function renderButton(action: MailAction): string {
  const url = escapeHtml(action.url);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 16px;">
      <tr>
        <td align="center" bgcolor="${accent()}" style="border-radius:999px;">
          <a href="${url}"
             style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${escapeHtml(action.label)}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:12.5px;line-height:1.6;color:${MUTED};">
      If the button does not work, paste this into your browser:
    </p>
    <p style="margin:0;font-size:12.5px;line-height:1.6;word-break:break-all;">
      <a href="${url}" style="color:${accent()};">${url}</a>
    </p>`;
}

/* ── Shell ───────────────────────────────────────────────────────────────── */

export function renderHtml(message: MailMessage): string {
  const blocks = message.body.map(toBlock).map(renderBlock).join('');

  const button = message.action ? renderButton(message.action) : '';

  const secondary = message.secondaryAction
    ? `<p style="margin:18px 0 0;font-size:13.5px;line-height:1.6;">
         <a href="${escapeHtml(message.secondaryAction.url)}" style="color:${accent()};text-decoration:underline;">
           ${escapeHtml(message.secondaryAction.label)}
         </a>
       </p>`
    : '';

  const footnote = message.footnote
    ? `<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${HAIRLINE};font-size:12.5px;line-height:1.6;color:${MUTED};">
         ${escapeHtml(message.footnote)}
       </p>`
    : '';

  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(absoluteUrl(brand.logoUrl))}" width="34" height="34" alt=""
            style="display:block;border:0;outline:none;text-decoration:none;border-radius:8px;" />`
    : '';

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(message.subject)}</title>
</head>
<body style="margin:0;padding:0;width:100%;background:${PAGE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Inbox preview text, then blank characters so the body copy does not spill into it. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE};opacity:0;">
    ${escapeHtml(message.preheader)}
    ${'&#8199;&#65279;&#847; '.repeat(40)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${PAGE};padding:32px 14px;">
    <tr>
      <td align="center">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;margin:0 auto;font-family:${FONT};">

          <tr>
            <td style="background:${CARD};border-radius:16px;padding:32px 30px;">

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                <tr>
                  ${logo ? `<td width="34" style="padding-right:10px;">${logo}</td>` : ''}
                  <td style="font-size:17px;font-weight:700;letter-spacing:-0.01em;color:${INK};">
                    ${escapeHtml(brand.name)}
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:650;letter-spacing:-0.02em;color:${INK};">
                ${escapeHtml(message.heading)}
              </h1>

              ${blocks}
              ${button}
              ${secondary}
              ${footnote}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 30px 0;font-size:11.5px;line-height:1.7;color:${FAINT};">
              ${escapeHtml(company.legalName)} &middot; ${escapeHtml(companyAddress())}<br />
              Questions? Write to
              <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${FAINT};">${escapeHtml(brand.supportEmail)}</a>.
              This message was sent to ${escapeHtml(message.to)} about their ${escapeHtml(brand.name)} account.
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Plain text ──────────────────────────────────────────────────────────── */

function blockToText(block: MailBlock): string {
  switch (block.kind) {
    case 'text':
      return block.text;
    case 'code':
      return [block.code, block.caption].filter(Boolean).join('\n');
    case 'facts':
      return block.rows.map((row) => `${row.label}: ${row.value}`).join('\n');
    case 'list':
      return block.items.map((item) => `  - ${item}`).join('\n');
    case 'callout':
      return block.text;
  }
}

export function renderText(message: MailMessage): string {
  const parts = [
    message.heading,
    '',
    ...message.body.map(toBlock).map(blockToText),
  ];

  if (message.action) {
    parts.push('', `${message.action.label}: ${message.action.url}`);
  }
  if (message.secondaryAction) {
    parts.push(`${message.secondaryAction.label}: ${message.secondaryAction.url}`);
  }
  if (message.footnote) {
    parts.push('', message.footnote);
  }

  parts.push(
    '',
    '—',
    `${company.legalName} · ${companyAddress()}`,
    `Questions? Write to ${brand.supportEmail}.`,
  );

  return parts.join('\n');
}

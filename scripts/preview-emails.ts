/**
 * Renders every transactional email to `.email-preview/` so the templates can
 * be opened in a browser and read.
 *
 * No provider, no database and no send: the templates are plain functions, so
 * checking the copy and the layout costs nothing and does not put a test
 * message in anyone's inbox.
 *
 *   npm run email:preview
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PLANS, TRIAL_DAYS, findPlan } from '../src/lib/config/plans';
import { renderHtml, renderText } from '../src/lib/email/render';
import {
  passwordResetEmail,
  subscriptionRequestedEmail,
  trialStartedEmail,
  verificationCodeEmail,
  welcomeEmail,
} from '../src/lib/email/templates';

const to = 'ama.serwaa@example.com';
const name = 'Ama Serwaa';
const organizationName = 'Serwaa Trading Ltd.';
const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
const business = findPlan('business') ?? PLANS[1];

const samples = {
  '1-verification-code': verificationCodeEmail({
    to,
    name,
    code: '284913',
    url: 'https://adwuma360.app/verify-email?token=preview',
    expiresInMinutes: 60 * 24,
  }),
  '2-welcome': welcomeEmail({ to, name, organizationName }),
  '3-password-reset': passwordResetEmail({
    to,
    name,
    url: 'https://adwuma360.app/reset-password?token=preview',
    expiresInMinutes: 60,
  }),
  '4-trial-started': trialStartedEmail({
    to,
    name,
    organizationName,
    trialEndsAt,
    plan: business,
  }),
  '5-subscription-requested': subscriptionRequestedEmail({
    to,
    name,
    organizationName,
    plan: business,
    period: 'annual',
    trialEndsAt,
  }),
};

async function main() {
  const out = join(process.cwd(), '.email-preview');
  await mkdir(out, { recursive: true });

  const index: string[] = [];

  for (const [slug, message] of Object.entries(samples)) {
    await writeFile(join(out, `${slug}.html`), renderHtml(message), 'utf8');
    await writeFile(join(out, `${slug}.txt`), renderText(message), 'utf8');
    index.push(
      `<li><a href="./${slug}.html">${message.subject}</a> (<a href="./${slug}.txt">plain text</a>)</li>`,
    );
  }

  await writeFile(
    join(out, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Email previews</title>
     <body style="font:15px/1.6 system-ui;padding:32px;max-width:40rem;">
       <h1>Email previews</h1>
       <ul>${index.join('')}</ul>
     </body>`,
    'utf8',
  );

  console.log(`Wrote ${Object.keys(samples).length} previews to ${out}`);
}

void main();

import { brand } from '@/lib/config/brand';
import {
  expandedIncludes,
  planPrice,
  TRIAL_DAYS,
  type BillingPeriod,
  type Plan,
} from '@/lib/config/plans';
import { formatDate } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import { absoluteUrl } from '@/lib/url';

import { callout, code, facts, list } from './blocks';
import type { MailMessage } from './render';

/**
 * Every transactional message the product sends.
 *
 * Templates are plain functions returning a `MailMessage`, so they can be
 * rendered and eyeballed (`npm run email:preview`) without a provider, a
 * database or a send. Copy lives here and nowhere else — a server action says
 * *when* to send, never *what* it says.
 */

/** "Alex Mensah" → "Alex". Falls back to the whole string. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/* ── 1. Confirm your email (one-time code) ───────────────────────────────── */

export function verificationCodeEmail(input: {
  to: string;
  name: string;
  code: string;
  url: string;
  expiresInMinutes: number;
}): MailMessage {
  const hours = Math.round(input.expiresInMinutes / 60);
  const window =
    input.expiresInMinutes >= 120
      ? `${hours} hours`
      : `${input.expiresInMinutes} minutes`;

  return {
    to: input.to,
    subject: `${input.code} is your ${brand.name} confirmation code`,
    preheader: `Your code is ${input.code}. It expires in ${window}.`,
    heading: `Confirm your email address`,
    body: [
      `Hi ${firstName(input.name)}, enter this code on the confirmation screen to finish securing your ${brand.name} account.`,
      code(input.code, `Expires in ${window}`),
      'Prefer one click? The button below confirms the address without typing anything.',
    ],
    action: { label: 'Confirm my email', url: input.url },
    footnote:
      'If you did not create this account, you can ignore this message — nothing will happen until the code is used.',
  };
}

/* ── 2. Account created, email confirmed ─────────────────────────────────── */

export function welcomeEmail(input: {
  to: string;
  name: string;
  organizationName: string;
}): MailMessage {
  return {
    to: input.to,
    subject: `Your ${brand.name} account is ready`,
    preheader: `${input.organizationName} is set up and waiting for you.`,
    heading: `You're all set, ${firstName(input.name)}.`,
    body: [
      `Your email is confirmed and ${input.organizationName} is ready to use. Password recovery and account notifications now work on this address.`,
      'A good first hour, in order:',
      list([
        'Add your company details and logo, so they appear on every invoice',
        'Import or add a handful of customers',
        'Put your products and services into the catalogue with their prices',
        'Raise a quotation, turn it into an invoice, and record the payment',
      ]),
    ],
    action: { label: 'Open your workspace', url: absoluteUrl('/dashboard') },
    secondaryAction: {
      label: 'Set up your company details',
      url: absoluteUrl('/settings/company'),
    },
    footnote: `You are receiving this because this address opened a workspace on ${brand.name}.`,
  };
}

/* ── 3. Password reset ───────────────────────────────────────────────────── */

export function passwordResetEmail(input: {
  to: string;
  name: string;
  url: string;
  expiresInMinutes: number;
}): MailMessage {
  return {
    to: input.to,
    subject: `Reset your ${brand.name} password`,
    preheader: `A reset link valid for ${input.expiresInMinutes} minutes.`,
    heading: 'Reset your password',
    body: [
      `Hi ${firstName(input.name)}, someone asked to reset the password for this address. Choose a new one with the button below.`,
      callout(
        `The link works once and expires in ${input.expiresInMinutes} minutes. Until you use it, your current password keeps working.`,
      ),
    ],
    action: { label: 'Choose a new password', url: input.url },
    footnote:
      'If this was not you, no action is needed — the link cannot change anything on its own, and your password has not changed.',
  };
}

/* ── 4. Free trial started ───────────────────────────────────────────────── */

export function trialStartedEmail(input: {
  to: string;
  name: string;
  organizationName: string;
  trialEndsAt: Date;
  plan: Plan;
}): MailMessage {
  return {
    to: input.to,
    subject: `Your ${TRIAL_DAYS}-day ${brand.name} trial has started`,
    preheader: `Full access until ${formatDate(input.trialEndsAt)}. No card needed.`,
    heading: `${TRIAL_DAYS} days on us, ${firstName(input.name)}.`,
    body: [
      `${input.organizationName} has the complete ${input.plan.name} feature set for the next ${TRIAL_DAYS} days. No card was taken and nothing renews on its own — when the trial ends the workspace simply waits for you to pick a plan.`,
      facts([
        { label: 'Workspace', value: input.organizationName },
        { label: 'Trial', value: `${TRIAL_DAYS} days, full access` },
        { label: 'Ends on', value: formatDate(input.trialEndsAt) },
        { label: 'Card on file', value: 'None' },
      ]),
      'What you can use straight away:',
      list(expandedIncludes(input.plan).slice(0, 5)),
    ],
    action: { label: 'Start setting up', url: absoluteUrl('/dashboard') },
    secondaryAction: { label: 'Compare the plans', url: absoluteUrl('/pricing') },
    footnote: `Days remaining are shown on your billing page. Your data stays exportable at any time, trial or not.`,
  };
}

/* ── 5. Plan requested (subscription) ────────────────────────────────────── */

export function subscriptionRequestedEmail(input: {
  to: string;
  name: string;
  organizationName: string;
  plan: Plan;
  period: BillingPeriod;
  trialEndsAt?: Date | null;
}): MailMessage {
  const amount = planPrice(input.plan, input.period);

  const price =
    amount === null
      ? 'Priced with you'
      : `${formatCurrency(amount)} ${input.period === 'annual' ? 'a year' : 'a month'}`;

  return {
    to: input.to,
    subject: `${input.plan.name} plan requested for ${input.organizationName}`,
    preheader: `We have your request for the ${input.plan.name} plan. Nothing has been charged.`,
    heading: `Your ${input.plan.name} plan request is in.`,
    body: [
      `Thanks ${firstName(input.name)} — we have recorded that ${input.organizationName} wants to move to ${input.plan.name}.`,
      facts([
        { label: 'Workspace', value: input.organizationName },
        { label: 'Plan', value: input.plan.name },
        { label: 'Billing', value: input.period === 'annual' ? 'Yearly' : 'Monthly' },
        { label: 'Price', value: price },
        { label: 'Seats', value: input.plan.seats },
        ...(input.trialEndsAt
          ? [{ label: 'Trial runs until', value: formatDate(input.trialEndsAt) }]
          : []),
      ]),
      callout(
        'Nothing has been charged. Online payment is not switched on yet, so a person will contact you to arrange it and confirm the start date.',
      ),
      `${input.plan.name} includes:`,
      list(expandedIncludes(input.plan).slice(0, 5)),
    ],
    action: { label: 'Review your billing page', url: absoluteUrl('/settings/billing') },
    footnote: `Changed your mind? You can withdraw the request on the billing page, or reply to ${brand.supportEmail}.`,
  };
}

import { brand } from '@/lib/config/brand';
import {
  expandedIncludes,
  planPrice,
  PLATFORM_CURRENCY,
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
      'If you did not create this account, you can ignore this message. Nothing will happen until the code is used.',
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
      'If this was not you, no action is needed. The link cannot change anything on its own, and your password has not changed.',
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
      `${input.organizationName} has the complete ${input.plan.name} feature set for the next ${TRIAL_DAYS} days. No card was taken and nothing renews on its own. When the trial ends the workspace simply waits for you to pick a plan.`,
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
      : `${formatCurrency(amount, { currency: PLATFORM_CURRENCY })} ${
          input.period === 'annual' ? 'a year' : 'a month'
        }`;

  return {
    to: input.to,
    subject: `${input.plan.name} plan requested for ${input.organizationName}`,
    preheader: `We have your request for the ${input.plan.name} plan. Nothing has been charged.`,
    heading: `Your ${input.plan.name} plan request is in.`,
    body: [
      `Thanks ${firstName(input.name)}. We have recorded that ${input.organizationName} wants to move to ${input.plan.name}.`,
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

/* ── 6. Invited to a workspace ───────────────────────────────────────────── */

export function teamInviteEmail(input: {
  to: string;
  name: string;
  invitedBy: string;
  organizationName: string;
  roleName: string;
  /**
   * Where the button goes. A brand new account is sent to set a password; an
   * address that already signs in is sent to the sign-in page, because being
   * added to a second workspace must not disturb the first.
   */
  url: string;
  existingAccount: boolean;
  expiresInHours?: number;
}): MailMessage {
  const hours = input.expiresInHours ?? 0;
  const days = Math.round(hours / 24);
  const window = hours >= 48 ? `${days} days` : `${hours} hours`;

  return {
    to: input.to,
    subject: `${input.invitedBy} added you to ${input.organizationName} on ${brand.name}`,
    preheader: input.existingAccount
      ? `Sign in and ${input.organizationName} will be waiting in your workspace switcher.`
      : `Set a password and you are in. The link is good for ${window}.`,
    heading: `You have been added to ${input.organizationName}`,
    body: [
      input.existingAccount
        ? `Hi ${firstName(input.name)}, ${input.invitedBy} has given you access to the ${input.organizationName} workspace on ${brand.name}. Sign in with this address as usual and pick it from the workspace switcher at the top of the sidebar. Your password has not changed.`
        : `Hi ${firstName(input.name)}, ${input.invitedBy} has given you access to the ${input.organizationName} workspace on ${brand.name}. Choose a password with the button below and you can sign in straight away.`,
      facts([
        { label: 'Workspace', value: input.organizationName },
        { label: 'Your role', value: input.roleName },
        { label: 'Sign in with', value: input.to },
        ...(input.existingAccount
          ? []
          : [{ label: 'Link valid for', value: window }]),
      ]),
      callout(
        'What you can see and change is set by your role, and whoever invited you can adjust it at any time.',
      ),
    ],
    action: {
      label: input.existingAccount ? 'Open the workspace' : 'Set my password',
      url: input.url,
    },
    footnote: input.existingAccount
      ? `Not expecting this? Ask ${input.invitedBy} to remove you, or reply to ${brand.supportEmail}.`
      : 'Not expecting this? You can ignore the message. The invitation does nothing until the link is used, and it expires on its own.',
  };
}

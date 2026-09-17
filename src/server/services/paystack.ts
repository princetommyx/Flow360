import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  MINOR_UNITS,
  PAYSTACK_API,
  paystackEnabled,
  paystackSecretKey,
} from '@/lib/config/paystack';
import { round } from '@/lib/money';

/**
 * Talking to Paystack.
 *
 * Every call goes out with the secret key, so nothing in this file may ever be
 * imported by a client component: `server-only` makes that a build error
 * rather than a leak.
 *
 * Paystack answers `{ status, message, data }` with HTTP 200 even for some
 * refusals, so the envelope is checked as well as the status code. A failure
 * comes back as a value rather than an exception, because every caller has a
 * person waiting who needs to be told something useful.
 */

export type PaystackResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<PaystackResult<T>> {
  if (!paystackEnabled()) {
    return { ok: false, error: 'Card payment is not configured on this deployment.' };
  }

  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_API}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      // Never cached: these are money operations and a stale answer is a wrong
      // answer, not an old one.
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Paystack could not be reached', error);
    return { ok: false, error: 'We could not reach the payment provider. Try again shortly.' };
  }

  type Envelope = { status?: boolean; message?: string; data?: T };
  let body: Envelope | null = null;
  try {
    body = (await response.json()) as Envelope;
  } catch {
    // A non-JSON answer is a gateway or an outage page, not Paystack.
    body = null;
  }

  if (!response.ok || !body?.status) {
    const message = body?.message ?? `Payment provider returned ${response.status}`;
    console.error('Paystack refused a request', { path, status: response.status, message });
    return { ok: false, error: message };
  }

  return { ok: true, data: body.data as T };
}

/* ── Plans ────────────────────────────────────────────────────────────────── */

export type PaystackPlan = {
  id: number;
  name: string;
  plan_code: string;
  amount: number;
  interval: string;
  currency: string;
};

export function fetchPlan(code: string) {
  return call<PaystackPlan>(`/plan/${encodeURIComponent(code)}`);
}

/* ── Checkout ─────────────────────────────────────────────────────────────── */

export type InitializedTransaction = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

/**
 * Starts a subscription checkout.
 *
 * The amount is deliberately not sent. With a `plan`, Paystack charges what
 * that plan says, and passing our own figure alongside it would create two
 * sources of truth for a price, one of which is a display string in a React
 * component. The caller checks the two agree *before* getting here.
 */
export function initializeSubscription(input: {
  email: string;
  planCode: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return call<InitializedTransaction>('/transaction/initialize', {
    method: 'POST',
    body: {
      email: input.email,
      plan: input.planCode,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    },
  });
}

export type VerifiedTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer: { customer_code: string; email: string };
  plan?: string | { plan_code?: string };
  metadata?: Record<string, unknown> | null;
};

export function verifyTransaction(reference: string) {
  return call<VerifiedTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

/* ── Subscriptions ────────────────────────────────────────────────────────── */

export type PaystackSubscription = {
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date: string | null;
  customer: { customer_code: string; email: string };
  plan: { plan_code: string; name: string; amount: number; interval: string };
};

export function fetchSubscription(code: string) {
  return call<PaystackSubscription>(`/subscription/${encodeURIComponent(code)}`);
}

/**
 * Stops a subscription renewing.
 *
 * Paystack wants the email token as well as the code, which is its way of
 * making a cancellation deliberate rather than guessable from a code alone.
 * The period already paid for is not refunded and not cut short: that is the
 * provider's behaviour and the product says so rather than pretending
 * otherwise.
 */
export function disableSubscription(code: string, emailToken: string) {
  return call<unknown>('/subscription/disable', {
    method: 'POST',
    body: { code, token: emailToken },
  });
}

/* ── Webhooks ─────────────────────────────────────────────────────────────── */

/**
 * Whether a webhook really came from Paystack.
 *
 * The signature is HMAC SHA-512 of the *raw* body with the secret key, so the
 * body must be read as text and verified before it is parsed: re-serialising
 * parsed JSON changes the bytes and the signature would never match again.
 *
 * Compared in constant time, because a plain `===` on a secret leaks its
 * contents one byte at a time to anyone patient enough to measure.
 */
export function webhookIsGenuine(rawBody: string, signature: string | null): boolean {
  if (!signature || !paystackEnabled()) return false;

  const expected = createHmac('sha512', paystackSecretKey())
    .update(rawBody, 'utf8')
    .digest('hex');

  const given = Buffer.from(signature, 'utf8');
  const mine = Buffer.from(expected, 'utf8');
  if (given.length !== mine.length) return false;

  return timingSafeEqual(given, mine);
}

/** Paystack quotes pesewas; everything above this line speaks cedis. */
export function fromMinorUnits(amount: number | null | undefined): number {
  return round((amount ?? 0) / MINOR_UNITS);
}

import { randomBytes, randomInt, createHash } from 'node:crypto';

/**
 * Verification / reset tokens.
 *
 * The raw token is emailed to the user; only its SHA-256 digest is stored, so
 * a database leak cannot be replayed against the reset endpoint.
 */

export function createToken() {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * The six-digit code that goes in the body of a confirmation email, for people
 * reading on a phone where following a link means leaving the app.
 *
 * `randomInt` rather than `Math.random`: it is uniform over the range and
 * cryptographically seeded, where `Math.random() * 1e6` is neither. The digest
 * is stored the same way as a token, though a six-digit preimage is of course
 * recoverable by anyone holding the database — which is why codes are only
 * issued for email confirmation, never for a password reset, and why the
 * record is burned after `MAX_CODE_ATTEMPTS` wrong guesses.
 */
export const CODE_DIGITS = 6;
export const MAX_CODE_ATTEMPTS = 5;

export function createCode() {
  const raw = String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, '0');
  return { raw, hash: hashToken(raw) };
}

/** Accepts the code however it was pasted — spaces, dashes, stray characters. */
export function normaliseCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, CODE_DIGITS);
}

export const TOKEN_TTL_MINUTES = {
  EMAIL_VERIFICATION: 60 * 24,
  PASSWORD_RESET: 60,
  INVITATION: 60 * 24 * 7,
} as const;

export function expiryFor(type: keyof typeof TOKEN_TTL_MINUTES) {
  return new Date(Date.now() + TOKEN_TTL_MINUTES[type] * 60_000);
}

import { randomBytes, createHash } from 'node:crypto';

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

export const TOKEN_TTL_MINUTES = {
  EMAIL_VERIFICATION: 60 * 24,
  PASSWORD_RESET: 60,
  INVITATION: 60 * 24 * 7,
} as const;

export function expiryFor(type: keyof typeof TOKEN_TTL_MINUTES) {
  return new Date(Date.now() + TOKEN_TTL_MINUTES[type] * 60_000);
}

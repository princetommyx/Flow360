import type { Prisma } from '@/generated/prisma/client';

import { db } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { absoluteUrl } from '@/lib/url';
import {
  createCode,
  createToken,
  expiryFor,
  hashToken,
  MAX_CODE_ATTEMPTS,
  normaliseCode,
  TOKEN_TTL_MINUTES,
} from '@/lib/tokens';
import { verificationCodeEmail, welcomeEmail } from '@/lib/email/templates';

/**
 * Email confirmation.
 *
 * One record carries two ways in: a long random token behind the link, and a
 * six-digit code for people reading on a phone. Either consumes the record, so
 * a code cannot outlive the link it was sent with. Re-issuing invalidates
 * everything outstanding, which means the newest email is always the only one
 * that works.
 */

/** A Prisma client or an interactive transaction — both satisfy this. */
type TokenWriter = Pick<Prisma.TransactionClient, 'verificationToken'>;

export type IssuedVerification = { token: string; code: string };

/**
 * Writes a fresh confirmation record, retiring any earlier one.
 *
 * Takes the writer so registration can do this inside the transaction that
 * creates the account — a committed user with no way to confirm their address
 * would be worse than no user at all.
 */
export async function issueEmailVerification(
  writer: TokenWriter,
  input: { userId: string; email: string },
): Promise<IssuedVerification> {
  const token = createToken();
  const code = createCode();

  await writer.verificationToken.updateMany({
    where: { userId: input.userId, type: 'EMAIL_VERIFICATION', usedAt: null },
    data: { usedAt: new Date() },
  });

  await writer.verificationToken.create({
    data: {
      token: token.hash,
      codeHash: code.hash,
      type: 'EMAIL_VERIFICATION',
      identifier: input.email,
      userId: input.userId,
      expiresAt: expiryFor('EMAIL_VERIFICATION'),
    },
  });

  return { token: token.raw, code: code.raw };
}

export async function sendVerificationEmail(input: {
  to: string;
  name: string;
  issued: IssuedVerification;
}): Promise<void> {
  await sendMail(
    verificationCodeEmail({
      to: input.to,
      name: input.name,
      code: input.issued.code,
      url: absoluteUrl(`/verify-email?token=${input.issued.token}`),
      expiresInMinutes: TOKEN_TTL_MINUTES.EMAIL_VERIFICATION,
    }),
  );
}

export type CodeCheck =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Checks a typed code against the newest outstanding record for an account.
 *
 * Six digits is a million guesses, so a wrong one costs an attempt and the
 * record is retired once `MAX_CODE_ATTEMPTS` are spent — the reader has to ask
 * for a new email rather than keep guessing at this one.
 */
export async function checkVerificationCode(input: {
  userId: string;
  code: string;
}): Promise<CodeCheck> {
  const digits = normaliseCode(input.code);
  if (digits.length !== 6) {
    return { ok: false, error: 'Enter the six digits from the email.' };
  }

  const record = await db.verificationToken.findFirst({
    where: {
      userId: input.userId,
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
      codeHash: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, codeHash: true, expiresAt: true, attempts: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return {
      ok: false,
      // Covers both an expired record and one burned by wrong guesses: the
      // reader's next step is the same either way.
      error: 'That code is no longer valid. Send yourself a new one and try again.',
    };
  }

  if (record.codeHash !== hashToken(digits)) {
    const attempts = record.attempts + 1;
    const spent = attempts >= MAX_CODE_ATTEMPTS;

    await db.verificationToken.update({
      where: { id: record.id },
      data: { attempts, ...(spent ? { usedAt: new Date() } : {}) },
    });

    return {
      ok: false,
      error: spent
        ? 'Too many incorrect codes. Send yourself a new one to continue.'
        : `That code is not right. ${MAX_CODE_ATTEMPTS - attempts} attempt${
            MAX_CODE_ATTEMPTS - attempts === 1 ? '' : 's'
          } left.`,
    };
  }

  await db.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { ok: true, userId: input.userId };
}

/**
 * Marks the address confirmed and says welcome.
 *
 * The welcome message is best-effort: the account is already verified by the
 * time it is sent, and a provider outage must not undo that.
 */
export async function completeEmailVerification(userId: string): Promise<void> {
  const user = await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
    select: {
      name: true,
      email: true,
      memberships: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { organization: { select: { name: true } } },
      },
    },
  });

  try {
    await sendMail(
      welcomeEmail({
        to: user.email,
        name: user.name,
        organizationName:
          user.memberships[0]?.organization.name ?? 'Your workspace',
      }),
    );
  } catch (error) {
    console.error('Welcome email could not be sent', error);
  }
}

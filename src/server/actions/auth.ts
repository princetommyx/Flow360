'use server';

import { redirect } from 'next/navigation';
import { hash } from 'bcryptjs';
import { AuthError } from 'next-auth';

import { db } from '@/lib/db';
import { auth, signIn, signOut } from '@/lib/auth';
import { absoluteUrl, sendMail } from '@/lib/mailer';
import { createToken, expiryFor, hashToken } from '@/lib/tokens';
import { brand } from '@/lib/config/brand';
import { slugify } from '@/lib/utils';
import { findCountry } from '@/lib/config/countries';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';
import { provisionOrganization } from '@/server/services/provisioning';
import type { ActionResult } from '@/server/actions/types';

export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Check the details you entered and try again.' };
  }

  try {
    await signIn('credentials', { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // `CredentialsSignin` is the only type that means the details were
      // wrong. Everything else — most often the database being unreachable —
      // is an infrastructure problem, and saying "wrong password" would send
      // the reader off to reset a password that was never the issue.
      if (error.type === 'CredentialsSignin') {
        return {
          ok: false,
          error: 'That email and password combination is not valid.',
        };
      }

      console.error('Sign-in failed for a non-credential reason', error);
      return {
        ok: false,
        error:
          'We could not reach the service to sign you in. This is not your password — please try again shortly.',
      };
    }
    throw error;
  }

  return { ok: true, data: { redirectTo: '/dashboard' } };
}

export async function registerAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid details.' };
  }

  const { name, email, organizationName, password, countryCode, dialCode, phone, plan } =
    parsed.data;

  const country = findCountry(countryCode);
  // E.164, with any spacing or dashes the user typed removed.
  const fullPhone = `+${dialCode}${phone.replace(/[^0-9]/g, '')}`;

  let existing: { id: string } | null;
  try {
    existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  } catch (error) {
    console.error('Registration failed reaching the database', error);
    return {
      ok: false,
      error:
        'We could not reach the service to create your workspace. Please try again shortly.',
    };
  }

  if (existing) {
    return {
      ok: false,
      error: 'An account already exists for that email. Try signing in instead.',
      field: 'email',
    };
  }

  const passwordHash = await hash(password, 12);
  const token = createToken();

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash, phone: fullPhone },
      select: { id: true },
    });

    const { organizationId } = await provisionOrganization(tx, {
      name: organizationName,
      slug: await uniqueSlug(tx, slugify(organizationName)),
      ownerUserId: user.id,
      // The chosen country sets the workspace's currency and locale defaults.
      currency: country?.currency,
      country: country?.name,
    });

    await tx.organization.update({
      where: { id: organizationId },
      data: {
        phone: fullPhone,
        country: country?.name ?? undefined,
        // The plan they clicked on the pricing page, kept as an intention.
        // The trial itself is identical whichever one they came from.
        requestedPlan: plan ?? null,
      },
    });

    await tx.verificationToken.create({
      data: {
        token: token.hash,
        type: 'EMAIL_VERIFICATION',
        identifier: email,
        userId: user.id,
        expiresAt: expiryFor('EMAIL_VERIFICATION'),
      },
    });
  });

  await sendMail({
    to: email,
    subject: `Confirm your ${brand.name} account`,
    heading: `Welcome to ${brand.name}, ${name.split(' ')[0]}.`,
    body: [
      `Your workspace "${organizationName}" is ready.`,
      'Confirm your email address to secure the account.',
    ],
    action: {
      label: 'Confirm email',
      url: absoluteUrl(`/verify-email?token=${token.raw}`),
    },
  });

  await signIn('credentials', { email, password, redirect: false });

  // Step two of sign-up: confirm the address we just sent the link to.
  return { ok: true, data: { redirectTo: '/verify-email' } };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  // A database failure must not surface as a 500 with a stack trace, and must
  // not surface as success either — that would leave someone waiting on a reset
  // link that was never going to arrive.
  let user: { id: string; name: string; email: string } | null;
  try {
    user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    console.error('Password reset failed reaching the database', error);
    return {
      ok: false,
      error:
        'We could not reach the service to send a reset link. Please try again shortly.',
    };
  }

  // Always report success so the form cannot be used to enumerate accounts.
  if (user) {
    const token = createToken();
    await db.verificationToken.create({
      data: {
        token: token.hash,
        type: 'PASSWORD_RESET',
        identifier: user.email,
        userId: user.id,
        expiresAt: expiryFor('PASSWORD_RESET'),
      },
    });

    // A provider outage must not leak whether the address exists, so the
    // response is unchanged either way — but it is logged, loudly.
    try {
      await sendMail({
        to: user.email,
        subject: `Reset your ${brand.name} password`,
        heading: 'Password reset requested',
        body: [
          `Hi ${user.name.split(' ')[0]}, use the link below to choose a new password.`,
          'The link expires in 60 minutes. If this wasn’t you, no action is needed.',
        ],
        action: {
          label: 'Reset password',
          url: absoluteUrl(`/reset-password?token=${token.raw}`),
        },
      });
    } catch (error) {
      console.error('Password reset email could not be sent', error);
    }
  }

  return { ok: true, data: undefined };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
  }

  const record = await db.verificationToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });

  if (
    !record ||
    !record.userId ||
    record.type !== 'PASSWORD_RESET' ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return { ok: false, error: 'That reset link is invalid or has expired.' };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset links for this account.
    db.verificationToken.updateMany({
      where: { userId: record.userId, type: 'PASSWORD_RESET', usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, data: undefined };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const record = await db.verificationToken.findUnique({
    where: { token: hashToken(token) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });

  if (
    !record ||
    !record.userId ||
    record.type !== 'EMAIL_VERIFICATION' ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return { ok: false, error: 'That confirmation link is invalid or has expired.' };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, data: undefined };
}

export async function signOutAction() {
  await signOut({ redirect: false });
  redirect('/login');
}

async function uniqueSlug(
  tx: { organization: { findUnique: (args: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null> } },
  base: string,
) {
  const candidate = base || 'workspace';
  let slug = candidate;
  let suffix = 1;
  // Slugs are globally unique; append a counter until one is free.
  while (await tx.organization.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
  return slug;
}

/**
 * Re-issues the confirmation link for the signed-in account.
 *
 * Any outstanding link is consumed first, so only the newest one works and an
 * older email cannot be replayed.
 */
export async function resendVerificationAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Sign in again to resend the confirmation email.' };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true },
  });
  if (!user) {
    return { ok: false, error: 'That account no longer exists.' };
  }
  if (user.emailVerified) {
    return { ok: false, error: 'This address is already confirmed.' };
  }

  const token = createToken();

  await db.$transaction([
    db.verificationToken.updateMany({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.verificationToken.create({
      data: {
        token: token.hash,
        type: 'EMAIL_VERIFICATION',
        identifier: user.email,
        userId: user.id,
        expiresAt: expiryFor('EMAIL_VERIFICATION'),
      },
    }),
  ]);

  await sendMail({
    to: user.email,
    subject: `Confirm your ${brand.name} account`,
    heading: 'Confirm your email address',
    body: [
      `Hi ${user.name.split(' ')[0]}, use the link below to confirm this address.`,
      'The link expires in 24 hours.',
    ],
    action: {
      label: 'Confirm email',
      url: absoluteUrl(`/verify-email?token=${token.raw}`),
    },
  });

  return { ok: true, data: undefined };
}

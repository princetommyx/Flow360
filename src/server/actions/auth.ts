'use server';

import { redirect } from 'next/navigation';
import { hash } from 'bcryptjs';
import { AuthError } from 'next-auth';

import { db } from '@/lib/db';
import { signIn, signOut } from '@/lib/auth';
import { absoluteUrl, sendMail } from '@/lib/mailer';
import { createToken, expiryFor, hashToken } from '@/lib/tokens';
import { brand } from '@/lib/config/brand';
import { slugify } from '@/lib/utils';
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
      return { ok: false, error: 'That email and password combination is not valid.' };
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

  const { name, email, organizationName, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
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
      data: { name, email, passwordHash },
      select: { id: true },
    });

    await provisionOrganization(tx, {
      name: organizationName,
      slug: await uniqueSlug(tx, slugify(organizationName)),
      ownerUserId: user.id,
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

  return { ok: true, data: { redirectTo: '/dashboard' } };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

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

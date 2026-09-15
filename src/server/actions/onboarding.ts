'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { slugify } from '@/lib/utils';
import { findCountry } from '@/lib/config/countries';
import { findPlan, PLANS } from '@/lib/config/plans';
import { trialStartedEmail } from '@/lib/email/templates';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { provisionOrganization } from '@/server/services/provisioning';
import { ACTIVE_ORG_COOKIE } from '@/server/tenant';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * Setting up the first workspace for an account that has none.
 *
 * Registering with an email address builds the workspace in the same
 * transaction as the account, so this is for everyone who arrives another way:
 * today that means Google, where the account exists the moment they approve
 * the consent screen and there is nowhere for them to land until they have
 * told us who they are.
 *
 * Guarded on having no membership at all. Adding a second company is a
 * different thing with a different page, and letting this one do it would mean
 * a stale tab could quietly create a duplicate workspace.
 */
export async function completeOnboardingAction(
  input: unknown,
): Promise<ActionResult<{ organizationId: string }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return actionError('Sign in again to continue.');

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? 'Check the details.',
      parsed.error.issues[0]?.path.join('.'),
    );
  }
  const data = parsed.data;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user?.isActive) return actionError('Sign in again to continue.');

  const belonged = await db.organizationMember.count({ where: { userId } });
  if (belonged > 0) {
    return actionError(
      'This account already has a workspace. Refresh the page to open it.',
    );
  }

  const country = findCountry(data.countryCode);
  // E.164, with whatever spacing or dashes they typed removed.
  const phone = `+${data.dialCode}${data.phone.replace(/[^0-9]/g, '')}`;

  const organization = await db.$transaction(async (tx) => {
    const base = slugify(data.organizationName) || 'company';
    let slug = base;
    let suffix = 1;
    while (await tx.organization.findUnique({ where: { slug }, select: { id: true } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    const { organizationId } = await provisionOrganization(tx, {
      name: data.organizationName,
      slug,
      ownerUserId: user.id,
      // The chosen country sets the currency the books are kept in.
      currency: country?.currency,
      country: country?.name,
      email: user.email,
    });

    await tx.user.update({ where: { id: user.id }, data: { phone } });

    return tx.organization.update({
      where: { id: organizationId },
      data: {
        phone,
        country: country?.name ?? undefined,
        industry: data.industry || null,
      },
      select: { id: true, name: true, trialEndsAt: true },
    });
  });

  // The workspace is committed. A mail provider that is down must not turn a
  // finished sign-up into an error and strand an account.
  try {
    if (organization.trialEndsAt) {
      await sendMail(
        trialStartedEmail({
          to: user.email,
          name: user.name,
          organizationName: organization.name,
          trialEndsAt: organization.trialEndsAt,
          // Every trial runs on the full feature set whichever plan they
          // arrived from, so the email describes what they actually have.
          plan: findPlan('business') ?? PLANS[0],
        }),
      );
    }
  } catch (error) {
    console.error('Trial email could not be sent', error);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organization.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
  return actionOk({ organizationId: organization.id });
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { TRIAL_DAYS } from '@/lib/config/plans';
import { getTenantContext } from '@/server/tenant';
import { getPlatformContext } from '@/server/platform';

import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = { title: 'Tell us about your business' };

/**
 * The first screen of an account that has no workspace yet.
 *
 * Registering with an email address builds the workspace along with the
 * account, so nobody arriving that way ever sees this. It exists for everyone
 * who arrives another way, which today means Google: the account is created
 * the moment they approve the consent screen, and until they say who they are
 * there is nothing for the product to show them.
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // They already have one. This page is not how a second company is added.
  const context = await getTenantContext();
  if (context) redirect('/dashboard');

  // Staff operate the platform and are meant to have no workspace at all.
  const platform = await getPlatformContext();
  if (platform) redirect('/admin');

  // A membership that exists but does not resolve means access was taken
  // away, which is a different message on a different page.
  const belonged = await db.organizationMember.count({
    where: { userId: session.user.id },
  });
  if (belonged > 0) redirect('/no-workspace');

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true },
  });

  return (
    <AuthPanel
      showcase={{
        headline: 'One more step and the workspace is yours',
        sub: `Everything starts empty and private to you: your customers, your stock, your books. The ${TRIAL_DAYS}-day trial begins the moment you finish here, and no card is involved.`,
      }}
    >
      <Logo size={32} />

      <header className="mt-9">
        <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em]">
          Tell us about your business
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
          Welcome, {user.name.split(' ')[0]}. Four details and you are in. Everything
          else can wait until you have had a look around.
        </p>
      </header>

      <OnboardingForm />
    </AuthPanel>
  );
}

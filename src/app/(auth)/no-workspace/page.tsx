import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';
import { auth } from '@/lib/auth';
import { brand } from '@/lib/config/brand';
import { getTenantContext } from '@/server/tenant';
import { getPlatformContext } from '@/server/platform';

import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = { title: 'No workspace' };

/**
 * Signed in, with nothing to sign in to.
 *
 * Reached when every workspace an account belongs to is suspended, when its
 * last membership has been removed, or when the account itself has been
 * disabled. All three are true statements about the account rather than
 * faults, and all three used to end in a redirect loop.
 */
export default async function NoWorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Access restored while they sat on this page. Send them in.
  const context = await getTenantContext();
  if (context) redirect('/dashboard');

  // An Adwuma360 staff account is meant to have no workspace, so for them this
  // is not a problem to explain, it is simply the way in.
  const platform = await getPlatformContext();

  if (platform) {
    return (
      <AuthPanel>
        <Logo size={32} />

        <div className="mt-8 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </div>

        <h1 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.03em]">
          Welcome back, {platform.user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
          This is a staff account, so it has no workspace of its own and no
          company to open. It operates {brand.name} itself.
        </p>

        <div className="mt-7 grid gap-2.5">
          <Button asChild size="xl" className="w-full rounded-full">
            <Link href="/admin">Open the operator console</Link>
          </Button>
          <SignOutButton />
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel>
      <Logo size={32} />

      <div className="mt-8 flex size-11 items-center justify-center rounded-xl bg-warning-soft text-warning">
        <Building2 className="size-5" aria-hidden />
      </div>

      <h1 className="mt-5 text-[1.65rem] font-semibold tracking-[-0.03em]">
        No workspace to open
      </h1>
      <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        You are signed in as{' '}
        <span className="font-medium text-foreground">{session.user.email}</span>, but
        this account does not currently have access to a workspace. That happens when
        the workspace has been suspended, or when your access to it has been removed.
      </p>
      <p className="mt-3 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        Nothing has been deleted. If you think this is wrong, the owner of your
        workspace can restore your access, or write to{' '}
        <a href={`mailto:${brand.supportEmail}`} className="font-medium text-primary hover:underline">
          {brand.supportEmail}
        </a>
        .
      </p>

      <div className="mt-7 grid gap-2.5">
        <Button asChild size="xl" className="w-full rounded-full">
          <Link href="/register">Start a new workspace</Link>
        </Button>
        <SignOutButton />
      </div>
    </AuthPanel>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

import { LogoMark } from '@/components/brand/logo';
import { brand } from '@/lib/config/brand';
import { requirePlatformAdmin } from '@/server/platform';
import { getTenantContext } from '@/server/tenant';

import { ConsoleNav } from './console-nav';
import { SignOutButton } from './sign-out-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Operator console', template: `%s · Operator console` },
  robots: { index: false, follow: false },
};

/**
 * The operator console's shell.
 *
 * Outside `(app)` on purpose: no tenant sidebar, no active-organization
 * cookie, no permission-filtered navigation. It is also deliberately a
 * different shape and colour from a workspace, so nobody spends a moment
 * wondering whose data they are looking at.
 */
export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await requirePlatformAdmin();

  // A staff account has no workspace, so offering it a way into one would be
  // a link to a page telling them they have none.
  const tenant = await getTenantContext();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-subtle">
      <header className="sticky top-0 z-40 border-b border-border bg-brand text-brand-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3 md:px-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">
              {brand.name}
            </span>
          </Link>

          <span className="inline-flex items-center gap-1 rounded-full bg-brand-foreground/15 px-2 py-0.5 text-[11.5px] font-semibold">
            <ShieldCheck className="size-3" aria-hidden />
            Operator console
          </span>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[12.5px] font-medium leading-tight">
                {context.user.name}
              </p>
              <p className="text-[11.5px] leading-tight opacity-75">
                {context.viaBootstrap ? 'Access from the environment list' : 'Staff'}
              </p>
            </div>
            {tenant ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-[12.5px] font-medium opacity-90 transition-opacity hover:opacity-100"
              >
                My workspace <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            ) : (
              <SignOutButton />
            )}
          </div>
        </div>

        <ConsoleNav />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 md:px-8">{children}</main>

      <footer className="border-t border-border px-5 py-5 text-center text-[12px] text-muted-foreground md:px-8">
        This console reports about workspaces: their plans, their dates and how
        much they hold. It never opens what is inside one.
      </footer>
    </div>
  );
}

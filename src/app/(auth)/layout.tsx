import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { brand } from '@/lib/config/brand';

function backdropExists() {
  if (!brand.heroImageUrl || brand.heroImageUrl.startsWith('http')) {
    return Boolean(brand.heroImageUrl);
  }
  return existsSync(path.join(process.cwd(), 'public', brand.heroImageUrl));
}

/**
 * Authentication shell.
 *
 * A photographic or brand-tinted backdrop with the form presented on a sheet:
 * anchored to the bottom on phones, where reachability matters and the
 * backdrop only needs to set the tone, and centred from `sm` upward.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const hasPhoto = backdropExists();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[oklch(0.19_0.016_265)]">
      {hasPhoto && brand.heroImageUrl ? (
        <Image
          src={brand.heroImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="object-cover opacity-45 blur-[3px]"
        />
      ) : null}

      {/*
        Brand wash so the sheet always sits on a consistent ground. Without a
        photograph these carry the backdrop on their own, so they are placed to
        stay visible above the sheet rather than pushed to the corners.
      */}
      <div
        className="absolute -left-24 -top-24 size-[34rem] rounded-full opacity-60 blur-3xl"
        style={{ background: 'var(--brand-primary)' }}
        aria-hidden
      />
      <div
        className="absolute -right-20 top-10 size-[26rem] rounded-full opacity-45 blur-3xl"
        style={{ background: 'var(--brand-secondary)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
        aria-hidden
      />
      {hasPhoto ? (
        <div className="absolute inset-0 bg-[oklch(0.19_0.016_265)]/50" aria-hidden />
      ) : null}

      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <main className="relative z-10 flex min-h-dvh flex-col justify-end sm:items-center sm:justify-center sm:p-6">
        <div className="motion-safe:animate-rise w-full rounded-t-[1.75rem] border border-border bg-background px-6 pb-10 pt-8 shadow-2xl sm:max-w-[27rem] sm:rounded-2xl sm:px-8 sm:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

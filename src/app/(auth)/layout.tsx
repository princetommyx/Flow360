import type { Metadata } from 'next';

import { ThemeToggle } from '@/components/layout/theme-toggle';

/**
 * Sign-in, registration and everything token-shaped.
 *
 * `/login` and `/register` are worth indexing and set their own robots value
 * back; the rest of this group is a password reset or an invitation, which
 * should never appear in a result list.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Page ground for every auth screen. The card itself comes from `AuthPanel`. */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-dvh bg-muted/50 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <ThemeToggle className="absolute right-5 top-5 z-20 lg:right-10 lg:top-10" />
      {children}
    </div>
  );
}

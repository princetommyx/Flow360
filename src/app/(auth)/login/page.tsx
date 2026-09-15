import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';
import { auth, googleEnabled } from '@/lib/auth';
import { brand } from '@/lib/config/brand';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: { absolute: `Sign in to ${brand.name}` },
  description: `Sign in to your ${brand.name} workspace to manage invoicing, stock, expenses and payroll.`,
  alternates: { canonical: '/login' },
  // Overrides the group's blanket refusal: this one is worth finding.
  robots: { index: true, follow: true },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <AuthPanel
      showcase={{
        headline: 'Everything your business runs on, in one workspace',
        sub: 'Sales, purchasing, stock, money and people, all reading from the same records, so every report reflects the work your team actually did.',
      }}
    >
      <Logo size={32} />

      <header className="mt-9">
        <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em]">
          Log in to your account
        </h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Please enter your details
        </p>
      </header>

      <LoginForm googleEnabled={googleEnabled} />

      <p className="mt-8 text-[13px] text-muted-foreground">
        New to {brand.name}?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create a workspace
        </Link>
      </p>

      <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to home
        </Link>
        <p className="text-[11.5px] leading-relaxed text-muted-foreground sm:text-right">
          By continuing you agree to our{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms of Use
          </a>
          .
        </p>
      </div>
    </AuthPanel>
  );
}

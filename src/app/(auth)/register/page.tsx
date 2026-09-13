import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';
import { StepIndicator } from '@/components/shared/step-indicator';
import { auth, googleEnabled } from '@/lib/auth';
import { SIGNUP_STEPS } from '@/lib/config/signup-steps';

import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create your workspace' };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <AuthPanel
      showcase={{
        headline: 'Set up once, and every module already knows about it',
        sub: 'Your company details, tax rates and numbering flow into quotes, invoices, stock and the books — so nothing is configured twice.',
      }}
    >
      <Logo size={32} />

      <StepIndicator steps={SIGNUP_STEPS} current={1} className="mt-8" />

      <header className="mt-7">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">
          Create your workspace
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Ready in seconds.</p>
      </header>

      <RegisterForm googleEnabled={googleEnabled} />

      <p className="mt-8 border-t border-border pt-5 text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPanel>
  );
}

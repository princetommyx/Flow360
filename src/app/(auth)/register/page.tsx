import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LogoMark } from '@/components/brand/logo';
import { StepIndicator } from '@/components/shared/step-indicator';
import { auth, googleEnabled } from '@/lib/auth';
import { SIGNUP_STEPS } from '@/lib/config/signup-steps';

import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create your workspace' };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div>
      <LogoMark size={44} />

      <StepIndicator steps={SIGNUP_STEPS} current={1} className="mt-6" />

      <header className="mt-7">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">
          Create your workspace
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Ready in seconds.</p>
      </header>

      <RegisterForm googleEnabled={googleEnabled} />

      <p className="mt-6 border-t border-border pt-5 text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

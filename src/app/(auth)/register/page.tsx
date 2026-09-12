import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create your account' };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">
          Start running your business
        </h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Create a workspace in under a minute. No card required.
        </p>
      </header>

      <RegisterForm />

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Welcome back</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Sign in to pick up where your business left off.
        </p>
      </header>

      <LoginForm />

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

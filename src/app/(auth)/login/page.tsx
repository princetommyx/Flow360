import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { LogoMark } from '@/components/brand/logo';
import { auth, googleEnabled } from '@/lib/auth';
import { brand } from '@/lib/config/brand';

import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div>
      <LogoMark size={44} />

      <header className="mt-6">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">
          Welcome back
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Sign in to your {brand.name} workspace
        </p>
      </header>

      <LoginForm googleEnabled={googleEnabled} />

      <div className="mt-7 flex flex-col gap-4 border-t border-border pt-5">
        <p className="text-center text-[13px] text-muted-foreground">
          New to {brand.name}?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create a workspace
          </Link>
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to home
        </Link>
      </div>
    </div>
  );
}

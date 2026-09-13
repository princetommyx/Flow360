import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';

import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel>
      <Logo size={32} />

      <header className="mt-6">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">
          Reset your password
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Enter the email you sign in with and we&rsquo;ll send a reset link.
        </p>
      </header>

      <div className="mt-7">
        <ForgotPasswordForm />
      </div>

      <Link
        href="/login"
        className="mt-7 inline-flex items-center gap-1.5 border-t border-border pt-5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to sign in
      </Link>
    </AuthPanel>
  );
}

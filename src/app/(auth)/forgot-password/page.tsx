import type { Metadata } from 'next';
import Link from 'next/link';

import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Reset your password</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Enter the email you sign in with and we&rsquo;ll send a reset link.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

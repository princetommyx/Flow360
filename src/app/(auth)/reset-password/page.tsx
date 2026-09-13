import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';

import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Link not valid</h1>
        <Alert variant="destructive" className="mt-5">
          <AlertDescription className="text-foreground">
            This reset link is missing its token. Request a new one to continue.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-5 w-full rounded-full" size="xl">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <AuthPanel>
      <Logo size={32} />

      <header className="mt-6">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Pick something you haven&rsquo;t used before on this account.
        </p>
      </header>

      <div className="mt-7">
        <ResetPasswordForm token={token} />
      </div>
    </AuthPanel>
  );
}

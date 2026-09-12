import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
        <Button asChild className="mt-5 w-full" size="lg">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          Pick something you haven&rsquo;t used before on this account.
        </p>
      </header>

      <ResetPasswordForm token={token} />
    </div>
  );
}

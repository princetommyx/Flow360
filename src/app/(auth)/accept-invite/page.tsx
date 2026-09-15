import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { AuthPanel } from '@/components/marketing/auth-panel';
import { invitationSummary } from '@/server/services/verification';

import { AcceptInviteForm } from './accept-invite-form';

export const metadata: Metadata = { title: 'Accept your invitation' };

function Unusable({ message }: { message: string }) {
  return (
    <AuthPanel>
      <Logo size={32} />
      <h1 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.03em]">
        Invitation not valid
      </h1>
      <Alert variant="destructive" className="mt-5">
        <AlertDescription className="text-foreground">{message}</AlertDescription>
      </Alert>
      <Button asChild className="mt-5 w-full rounded-full" size="xl">
        <Link href="/login">Go to sign in</Link>
      </Button>
    </AuthPanel>
  );
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Unusable message="This link is missing its token. Ask for the invitation to be sent again." />
    );
  }

  const invitation = await invitationSummary(token);

  if (!invitation) {
    return (
      <Unusable message="This invitation has already been used or has expired. Ask whoever invited you to send a new one." />
    );
  }

  return (
    <AuthPanel>
      <Logo size={32} />

      <header className="mt-6">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em]">
          Join {invitation.organizationName}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          You are joining as {invitation.roleName}. Choose a password for{' '}
          <span className="font-medium text-foreground">{invitation.email}</span> and
          you are in.
        </p>
      </header>

      <div className="mt-7">
        <AcceptInviteForm token={token} />
      </div>
    </AuthPanel>
  );
}

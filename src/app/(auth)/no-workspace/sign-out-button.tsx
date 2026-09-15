'use client';

import * as React from 'react';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { signOutAction } from '@/server/actions/auth';

/** The way out. Without it this page is a dead end with a live session. */
export function SignOutButton() {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="secondary"
      size="xl"
      className="w-full rounded-full"
      loading={pending}
      onClick={() => startTransition(() => void signOutAction())}
    >
      {pending ? null : <LogOut />} Sign out
    </Button>
  );
}

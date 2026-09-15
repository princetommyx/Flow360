'use client';

import * as React from 'react';
import { LogOut } from 'lucide-react';

import { signOutAction } from '@/server/actions/auth';

/**
 * The console's way out, for a staff account with no workspace to return to.
 *
 * Plain rather than a Button: it sits on the brand bar beside the operator's
 * name, where a filled button would read as the page's main action.
 */
export function SignOutButton() {
  const [pending, startTransition] = React.useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void signOutAction())}
      className="flex items-center gap-1 text-[12.5px] font-medium opacity-90 transition-opacity hover:opacity-100 disabled:opacity-50"
    >
      Sign out <LogOut className="size-3.5" aria-hidden />
    </button>
  );
}

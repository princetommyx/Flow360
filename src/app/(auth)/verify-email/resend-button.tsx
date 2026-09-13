'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { resendVerificationAction } from '@/server/actions/auth';

/** Resend with a cooldown, so the link cannot be re-requested in a loop. */
export function ResendButton() {
  const [pending, setPending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setPending(true);
    try {
      const result = await resendVerificationAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Confirmation email sent again');
      setCooldown(45);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      className="w-full rounded-full"
      onClick={resend}
      loading={pending}
      disabled={cooldown > 0}
    >
      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
    </Button>
  );
}

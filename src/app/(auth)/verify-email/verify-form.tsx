'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CodeInput } from '@/components/shared/code-input';
import { resendVerificationAction, verifyEmailCodeAction } from '@/server/actions/auth';
import { runAction } from '@/lib/client-action';

/**
 * Confirming from the code in the email.
 *
 * The emailed link does the same job in one click; this is for the common case
 * of reading mail on a phone and having signed up on a laptop, where following
 * the link confirms the wrong device's session.
 */
export function VerifyForm() {
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(value: string) {
    if (value.length !== 6 || pending) return;

    setPending(true);
    setInvalid(false);
    try {
      const result = await runAction(() => verifyEmailCodeAction(value));
      if (!result.ok) {
        setInvalid(true);
        toast.error(result.error);
        return;
      }

      toast.success('Email confirmed');
      router.push('/dashboard');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const result = await runAction(() => resendVerificationAction());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // The previous code stops working the moment a new one is issued, so
      // clear the boxes rather than leave a dead code sitting in them.
      setCode('');
      setInvalid(false);
      toast.success('New code sent');
      setCooldown(45);
    } finally {
      setResending(false);
    }
  }

  return (
    <form
      className="mt-7 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(code);
      }}
    >
      <CodeInput
        value={code}
        onChange={(value) => {
          setCode(value);
          setInvalid(false);
        }}
        onComplete={(value) => void submit(value)}
        disabled={pending}
        invalid={invalid}
        autoFocus
        label="Six-digit confirmation code"
      />

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-full"
        loading={pending}
        disabled={code.length !== 6}
      >
        Confirm my email
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="w-full rounded-full"
        onClick={resend}
        loading={resending}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
      </Button>
    </form>
  );
}

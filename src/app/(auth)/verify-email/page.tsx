import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo';
import { StepIndicator } from '@/components/shared/step-indicator';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SIGNUP_STEPS } from '@/lib/config/signup-steps';
import { verifyEmailAction } from '@/server/actions/auth';

import { ResendButton } from './resend-button';

export const metadata: Metadata = { title: 'Confirm your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Arriving from the emailed link.
  if (token) {
    const result = await verifyEmailAction(token);
    return result.ok ? (
      <Panel
        tone="success"
        icon={<CheckCircle2 className="size-5" aria-hidden />}
        step={2}
        title="Email confirmed"
        description="Your address is verified and your workspace is ready to use."
        action={{ href: '/dashboard', label: 'Go to your dashboard' }}
      />
    ) : (
      <Panel
        tone="error"
        icon={<XCircle className="size-5" aria-hidden />}
        step={2}
        title="That link is no longer valid"
        description={result.error}
        action={{ href: '/login', label: 'Back to sign in' }}
      />
    );
  }

  // Arriving straight after sign-up.
  const session = await auth();
  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, emailVerified: true },
      })
    : null;

  if (user?.emailVerified) {
    return (
      <Panel
        tone="success"
        icon={<CheckCircle2 className="size-5" aria-hidden />}
        step={2}
        title="Already confirmed"
        description="This address has been verified. Nothing else to do."
        action={{ href: '/dashboard', label: 'Go to your dashboard' }}
      />
    );
  }

  return (
    <div>
      <LogoMark size={44} />
      <StepIndicator steps={SIGNUP_STEPS} current={2} className="mt-6" />

      <div className="mt-7 flex size-11 items-center justify-center rounded-xl bg-info-soft text-info">
        <MailCheck className="size-5" aria-hidden />
      </div>

      <h1 className="mt-5 text-[1.75rem] font-semibold tracking-[-0.03em]">
        Check your inbox
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        We sent a confirmation link
        {user?.email ? (
          <>
            {' '}
            to <strong className="text-foreground">{user.email}</strong>
          </>
        ) : null}
        . Open it to finish securing your account — the link expires in 24 hours.
      </p>

      <div className="mt-7 grid gap-3">
        <Button size="xl" className="w-full rounded-full" asChild>
          <Link href="/dashboard">Continue to your workspace</Link>
        </Button>
        {session?.user ? <ResendButton /> : null}
      </div>

      <p className="mt-6 border-t border-border pt-5 text-center text-[12.5px] leading-relaxed text-muted-foreground">
        You can start working right away — confirming just secures password
        recovery and account notifications.
      </p>
    </div>
  );
}

function Panel({
  tone,
  icon,
  step,
  title,
  description,
  action,
}: {
  tone: 'success' | 'error';
  icon: React.ReactNode;
  step: number;
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-success-soft text-success'
      : 'bg-destructive-soft text-destructive';

  return (
    <div>
      <LogoMark size={44} />
      <StepIndicator steps={SIGNUP_STEPS} current={step} className="mt-6" />

      <div
        className={`mt-7 flex size-11 items-center justify-center rounded-xl ${toneClass}`}
      >
        {icon}
      </div>

      <h1 className="mt-5 text-[1.75rem] font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>

      <Button size="xl" className="mt-7 w-full rounded-full" asChild>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { verifyEmailAction } from '@/server/actions/auth';

export const metadata: Metadata = { title: 'Confirm your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Panel
        icon={<MailCheck className="size-5" aria-hidden />}
        tone="info"
        title="Confirm your email"
        description="We sent a confirmation link to the address you signed up with. Open it to finish securing your account."
        action={{ href: '/dashboard', label: 'Continue to dashboard' }}
      />
    );
  }

  const result = await verifyEmailAction(token);

  return result.ok ? (
    <Panel
      icon={<CheckCircle2 className="size-5" aria-hidden />}
      tone="success"
      title="Email confirmed"
      description="Your address is verified. You have full access to your workspace."
      action={{ href: '/dashboard', label: 'Go to dashboard' }}
    />
  ) : (
    <Panel
      icon={<XCircle className="size-5" aria-hidden />}
      tone="error"
      title="Link no longer valid"
      description={result.error}
      action={{ href: '/login', label: 'Back to sign in' }}
    />
  );
}

function Panel({
  icon,
  tone,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  tone: 'success' | 'error' | 'info';
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  const toneClass = {
    success: 'bg-success-soft text-success',
    error: 'bg-destructive-soft text-destructive',
    info: 'bg-info-soft text-info',
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
      <div
        className={`mx-auto mb-4 flex size-11 items-center justify-center rounded-xl ${toneClass}`}
      >
        {icon}
      </div>
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-5 w-full" size="lg">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}

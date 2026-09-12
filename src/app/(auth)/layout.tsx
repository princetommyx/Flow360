import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { brand } from '@/lib/config/brand';

const HIGHLIGHTS = [
  'Quote to invoice to payment, without re-keying anything',
  'Live stock levels tied to every sale and purchase',
  'Expenses, payroll and profit in one ledger',
  'Role-based access for every person in the business',
];

/** Split layout shared by sign in, sign up and password recovery. */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,32rem)]">
      {/* Brand panel — hidden on small screens where it would just push the form down */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-brand-foreground lg:flex">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-24 size-[26rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'var(--brand-secondary)' }}
          aria-hidden
        />

        <Link href="/" className="relative z-10 inline-flex">
          <Logo size={30} textClassName="text-brand-foreground" />
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-pretty text-3xl font-semibold leading-tight tracking-[-0.03em]">
            {brand.tagline}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed opacity-80">
            {brand.description}
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] opacity-90">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[13px] opacity-60">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </aside>

      <main className="flex flex-col bg-background">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="lg:hidden">
            <Logo size={28} />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-14 lg:px-10">
          <div className="w-full max-w-[24.5rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}

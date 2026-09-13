import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppFrame } from '@/components/marketing/app-frame';
import { brand } from '@/lib/config/brand';

const PROMISES = [
  'Quotes, invoices and payments in one thread',
  'Stock that moves when you sell, not when you remember',
  'Expenses, accounts and profit on the same ledger',
  'Roles that fit finance, sales and operations',
];

/**
 * Landing hero.
 *
 * Dark section so the product screenshot below it reads as the bright object
 * on the page — the interface is the argument, not the decoration around it.
 */
export function Hero({ hasPhoto = false }: { hasPhoto?: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-[oklch(0.19_0.016_265)] text-white">
      {/*
        Optional photograph, pushed well back: a dark base tint, a left-to-right
        gradient behind the copy column, and a blur. Text contrast has to win
        over the image in every case, so the scrim is deliberately heavy.
      */}
      {hasPhoto && brand.heroImageUrl ? (
        <>
          <Image
            src={brand.heroImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            aria-hidden
            className="-z-10 scale-105 object-cover opacity-[0.28] blur-[2px]"
          />
          <div
            className="absolute inset-0 -z-10 bg-[oklch(0.19_0.016_265)]/72"
            aria-hidden
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[oklch(0.17_0.016_265)] via-[oklch(0.19_0.016_265)]/92 to-transparent"
            aria-hidden
          />
        </>
      ) : null}

      {/* Depth: one warm brand wash, one cool accent, plus a faint dotted field */}
      <div
        className="absolute -left-40 -top-56 size-[44rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'var(--brand-primary)' }}
        aria-hidden
      />
      <div
        className="absolute -right-52 top-24 size-[36rem] rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--brand-secondary)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/55">
              {brand.name} workspace
            </p>

            <h1 className="motion-safe:reveal-mask mt-5 text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[3.4rem]">
              Your whole company,
              <br className="hidden sm:block" /> on one system.
            </h1>

            <p className="motion-safe:reveal-mask-delayed mt-5 max-w-xl text-pretty text-[15.5px] leading-relaxed text-white/70 md:text-[17px]">
              {brand.name} runs sales, purchasing, stock, money and people from a
              single set of records — so the number you see in a report is the
              same number the work actually produced.
            </p>

            <ul className="stagger mt-7 grid gap-2.5">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/15"
                    aria-hidden
                  >
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  <span className="text-[14.5px] leading-snug text-white/85">
                    {promise}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="xl" asChild className="w-full sm:w-auto">
                <Link href="/register">
                  Start free <ArrowRight />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                asChild
                className="w-full border-white/25 text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>

            <p className="mt-4 text-[12.5px] text-white/50">
              No card required · Set up in minutes · Your data stays exportable
            </p>
          </div>

          {/* Bleeds off the right edge on wide screens so the app feels larger than the page */}
          <div className="lg:-mr-24 xl:-mr-40">
            <AppFrame
              src="/product/dashboard.png"
              alt="The Flow360 dashboard, showing revenue, outstanding invoices, expenses and net profit alongside a revenue trend chart and recent invoices."
              width={2800}
              height={1760}
              priority
              className="border-white/10 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.7)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Reveal } from '@/components/shared/reveal';
import { PLANS, TRIAL_DAYS } from '@/lib/config/plans';
import { brand } from '@/lib/config/brand';

import { PricingPlans } from './pricing-plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Start with a ${TRIAL_DAYS}-day free trial of ${brand.name}. No card required.`,
};

const INCLUDED_EVERYWHERE = [
  'Unlimited customers and suppliers',
  'Printable invoices and quotations',
  'CSV export from every list and report',
  'Role-based access control',
  'Your data stays exportable, always',
];

const FAQS = [
  {
    q: `What happens after the ${TRIAL_DAYS} days?`,
    a: `The trial runs for ${TRIAL_DAYS} days on the full Business feature set, not a cut-down version, so you are evaluating the real product. Near the end we will prompt you to pick a plan. Nothing is charged automatically, because you never gave us a card to charge.`,
  },
  {
    q: 'Do I need a card to start?',
    a: 'No. You create a workspace with an email address and start working. We ask for payment details only when you choose a plan at the end of the trial.',
  },
  {
    q: 'What happens to my data if I do not subscribe?',
    a: 'It stays yours. Every list and report exports to CSV, and invoices and quotations print to PDF, so you can take everything with you whether or not you continue.',
  },
  {
    q: 'Can I change plan later?',
    a: 'Yes, in either direction. Moving up takes effect immediately; moving down applies at the end of the period you have already paid for.',
  },
  {
    q: 'Is there a per-user charge?',
    a: 'No. Each plan includes a number of users, and the price does not change as you add people up to that number. Roles let you give read-only access without using a seat differently to anyone else.',
  },
  {
    q: 'Can I run more than one company?',
    a: 'Starter covers a single company. Business covers three, and Enterprise is unlimited. Each company is fully separate, with its own customers, stock and books, and you switch between them from the sidebar.',
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              Pricing
            </p>
            <h1 className="mt-3 text-balance text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.03em] md:text-5xl">
              Free for a month. Then only if it earns its place.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base">
              Every workspace starts with {TRIAL_DAYS} days of the full Business
              plan. No card, no feature gates, no sales call. Decide at the end, on
              the strength of a month of your own real data.
            </p>
          </div>

          <div className="mt-12">
            <PricingPlans />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface-subtle py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="On every plan"
              title="The things that should never be an upsell"
            />
          </Reveal>

          <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED_EVERYWHERE.map((item) => (
              <li key={item}>
                <Card className="flex items-start gap-2.5 p-4 text-[13.5px] leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto w-full max-w-3xl px-5 md:px-8">
          <Reveal>
            <SectionHeading align="center" title="Pricing questions" />
          </Reveal>
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-brand px-8 py-14 text-center text-brand-foreground md:px-16">
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                backgroundSize: '26px 26px',
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Try it on a month of your own numbers
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed opacity-85">
                {PLANS.length} plans, {TRIAL_DAYS} days free on all of them, and an
                export button on everything if you decide against it.
              </p>
              <Button size="xl" variant="secondary" asChild className="mt-8">
                <Link href="/register">
                  Start free <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PLATFORM_CURRENCY, PLANS, TRIAL_DAYS, annualSaving, headlineAnnualSaving } from '@/lib/config/plans';
import { brand } from '@/lib/config/brand';
import { formatCurrency } from '@/lib/money';
import { cn } from '@/lib/utils';

/** Plan cards with a monthly/annual toggle. */
export function PricingPlans() {
  const [annual, setAnnual] = React.useState(true);
  const saving = headlineAnnualSaving();

  return (
    <div>
      <div className="flex flex-col items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full border border-border bg-muted/60 p-1"
        >
          {[
            { id: 'monthly', label: 'Monthly' },
            { id: 'annual', label: 'Annual' },
          ].map((option) => {
            const selected = (option.id === 'annual') === annual;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnnual(option.id === 'annual')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                  selected
                    ? 'bg-surface text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          {saving === null
            ? 'Pay monthly or yearly — same features either way'
            : annual
              ? `Paying yearly saves at least ${saving}%`
              : `Switch to yearly and save at least ${saving}%`}
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = annual ? plan.annual : plan.monthly;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col p-6',
                plan.featured
                  ? 'border-primary/40 shadow-lg ring-1 ring-primary/20'
                  : 'hover-lift',
              )}
            >
              {plan.featured ? (
                <Badge className="absolute -top-2.5 left-6">Most popular</Badge>
              ) : null}

              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{plan.name}</h3>
              <p className="mt-1.5 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {plan.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                {price === null ? (
                  <span className="text-[1.75rem] font-semibold tracking-[-0.025em]">
                    Let&rsquo;s talk
                  </span>
                ) : (
                  <>
                    <span className="text-[2rem] font-semibold tracking-[-0.03em] tabular">
                      {formatCurrency(price, { compact: false, currency: PLATFORM_CURRENCY }).replace(/\.00$/, '')}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {annual ? 'per year' : 'per month'}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {price === null
                  ? 'Priced on your entity count and support needs'
                  : annual
                    ? (() => {
                        const percent = annualSaving(plan);
                        return percent === null
                          ? 'Billed once a year'
                          : `Billed once a year — ${percent}% less than monthly`;
                      })()
                    : 'Billed every month'}
              </p>

              <Button
                asChild
                size="lg"
                variant={plan.featured ? 'default' : 'secondary'}
                className="mt-6 w-full"
              >
                {plan.monthly === null ? (
                  <a href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent(`${brand.name} Enterprise enquiry`)}`}>
                    Talk to us <ArrowRight />
                  </a>
                ) : (
                  <Link href={`/register?plan=${plan.id}`}>
                    Start {TRIAL_DAYS}-day free trial <ArrowRight />
                  </Link>
                )}
              </Button>

              <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
                {plan.monthly === null
                  ? 'Custom terms available'
                  : 'No card required to start'}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
                <li className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {plan.seats}
                </li>
                {plan.includes.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[13px]">
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

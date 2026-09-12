import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  UserCog,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { brand } from '@/lib/config/brand';

const FEATURES = [
  {
    icon: FileText,
    title: 'Invoicing that closes the loop',
    body: 'Build an invoice from your catalogue, apply line discounts and tax, send it, then watch the balance fall as payments land. Statuses move themselves.',
  },
  {
    icon: Boxes,
    title: 'Stock that stays honest',
    body: 'Every sale, purchase and correction writes a stock movement. Quantities, valuation and reorder alerts stay accurate without a second system.',
  },
  {
    icon: Wallet,
    title: 'Books you can actually read',
    body: 'Payments, expenses and transfers post to one ledger across your bank, cash and card accounts, so profit is a number rather than a guess.',
  },
  {
    icon: ShieldCheck,
    title: 'Access that fits your org chart',
    body: 'Six role templates out of the box, with view, create, edit, delete and export controlled per module. Nobody sees more than they should.',
  },
  {
    icon: BarChart3,
    title: 'Reporting without exports',
    body: 'Sales, expenses, inventory and profit and loss are filtered by any period you like, printable, and exportable when you do need a file.',
  },
  {
    icon: Building2,
    title: 'Built for more than one company',
    body: 'Run several businesses or branches from one login. Data is isolated per company at the database level, not just hidden in the interface.',
  },
];

const MODULES = [
  { icon: FileText, label: 'Invoices' },
  { icon: ReceiptText, label: 'Quotations' },
  { icon: Users, label: 'Customers' },
  { icon: Wallet, label: 'Payments' },
  { icon: ShoppingCart, label: 'Purchasing' },
  { icon: Boxes, label: 'Inventory' },
  { icon: TrendingDown, label: 'Expenses' },
  { icon: BarChart3, label: 'Accounts' },
  { icon: UserCog, label: 'Employees' },
  { icon: Wallet, label: 'Payroll' },
  { icon: FolderKanban, label: 'Projects' },
  { icon: ShieldCheck, label: 'Permissions' },
];

const STEPS = [
  {
    title: 'Set up your company once',
    body: 'Add your details, currency, tax rates and invoice numbering. Everything downstream inherits it — you never retype a tax rate again.',
  },
  {
    title: 'Bring in customers and your catalogue',
    body: 'Create customers, products and services with purchase and selling prices. Stock levels and reorder points come along for the ride.',
  },
  {
    title: 'Sell, buy and get paid',
    body: 'Quote, convert to invoice, record the payment. Raise purchase orders, receive stock, log the bill. Each step updates the next.',
  },
  {
    title: 'Watch the numbers move',
    body: 'The dashboard and reports read from the same records, so revenue, spend, stock and profit are always current — no reconciliation ritual.',
  },
];

const BENEFITS = [
  'One record of truth instead of five spreadsheets',
  'Quotes convert to invoices without retyping a line',
  'Stock and books update from the same transaction',
  'Overdue invoices surface before they become bad debt',
  'Role-based access for finance, sales and operations',
  'Every list searchable, filterable and exportable',
];

const FAQS = [
  {
    q: 'Can I run more than one business on one account?',
    a: 'Yes. Each company you create is a fully separate workspace with its own customers, catalogue, stock and books. Switch between them from the sidebar; records are scoped per company in the database, so nothing leaks across.',
  },
  {
    q: 'Do I have to use every module?',
    a: 'No. Start with invoicing and customers, then switch on purchasing, inventory, payroll or projects when you need them. Roles also let you hide modules from people who do not use them.',
  },
  {
    q: 'How does invoice numbering work?',
    a: 'You choose the prefix, whether the year is included and how many digits the counter uses — for example INV-2026-00001. Numbers are issued atomically, so two people creating invoices at the same moment can never collide.',
  },
  {
    q: 'What happens to stock when I sell something?',
    a: 'Issuing an invoice for a tracked product writes a stock movement and reduces the quantity on hand. Receiving a purchase order does the reverse. Every change is kept in a history you can audit.',
  },
  {
    q: 'Can I get my data out?',
    a: 'Yes. Lists and reports export to CSV, and invoices and quotations produce print-ready PDFs. Your data stays yours.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div
          className="absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
          style={{ background: 'var(--brand-primary)' }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 text-center md:px-8 md:py-28">
          <Badge variant="default" className="mx-auto gap-1.5 px-3 py-1">
            <Sparkles className="size-3" aria-hidden />
            One platform, every part of the business
          </Badge>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl md:text-[3.5rem]">
            Run your entire business from one place
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-[17px]">
            Manage sales, invoices, customers, inventory, expenses and operations
            from one powerful business platform — built for teams who have
            outgrown spreadsheets but do not want enterprise software.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="xl" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Start free <ArrowRight />
              </Link>
            </Button>
            <Button size="xl" variant="secondary" asChild className="w-full sm:w-auto">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>

          <p className="mt-4 text-[12.5px] text-muted-foreground">
            No card required · Set up in minutes · Cancel any time
          </p>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Invoicing', 'Inventory', 'Expenses', 'Payroll', 'Projects', 'Reports'].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
                >
                  <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-b border-border py-20 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="max-w-2xl">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              What you get
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              The operational core, not another dashboard
            </h2>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Each module writes to the same records, so the work you do in one
              place shows up correctly everywhere else.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-6 transition-shadow hover:shadow-md">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="scroll-mt-20 border-b border-border bg-surface-subtle py-20 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="max-w-2xl">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              Modules
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              Twenty modules that already know about each other
            </h2>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <li key={module.label}>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate text-[13.5px] font-medium">
                      {module.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-border py-20 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                From setup to insight in four steps
              </h2>
              <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                No implementation project, no consultant. Most teams are issuing
                real invoices the same afternoon they sign up.
              </p>
              <Button size="lg" className="mt-7" asChild>
                <Link href="/register">
                  Create your workspace <ArrowRight />
                </Link>
              </Button>
            </div>

            <ol className="grid gap-4">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-border bg-surface-subtle py-20 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                Why teams switch
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Less admin, fewer surprises
              </h2>
              <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                The cost of scattered tools is not the subscriptions — it is the
                hours spent reconciling them and the decisions made on stale
                numbers.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-[13.5px] leading-relaxed shadow-sm"
                >
                  <Zap className="mt-0.5 size-4 shrink-0 text-brand-secondary" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-border py-20 md:py-24">
        <div className="mx-auto w-full max-w-3xl px-5 md:px-8">
          <h2 className="text-balance text-center text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Questions, answered
          </h2>
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

      {/* CTA */}
      <section className="py-20 md:py-24">
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
                Put the whole business on one system
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed opacity-85">
                Create a workspace, import your customers and issue your first
                invoice today. {brand.name} scales with you from there.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="xl" variant="secondary" asChild className="w-full sm:w-auto">
                  <Link href="/register">
                    Start free <ArrowRight />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="ghost"
                  asChild
                  className="w-full text-brand-foreground hover:bg-white/10 hover:text-brand-foreground sm:w-auto"
                >
                  <Link href="/pricing">Compare plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

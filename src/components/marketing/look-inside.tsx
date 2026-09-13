import { AppFrame } from '@/components/marketing/app-frame';
import { SectionHeading } from '@/components/marketing/section-heading';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

type Showcase = {
  eyebrow: string;
  title: string;
  body: string;
  src: string;
  alt: string;
};

/**
 * Every screenshot below is captured from the running application against the
 * seeded demo workspace — nothing here is a mockup. Sections are added as each
 * module ships, so the page can never advertise a screen that does not exist.
 */
const SHOWCASES: Showcase[] = [
  {
    eyebrow: 'Dashboard',
    title: 'Know where the business stands before anyone asks',
    body: 'Revenue, outstanding balances, spend and net profit for any period you choose — today, this quarter, or a range you type in. Every figure is read from the same records your team works in, so there is nothing to reconcile.',
    src: '/product/dashboard.png',
    alt: 'Flow360 dashboard showing metric tiles, a revenue and expense trend chart, invoice status breakdown and recent activity.',
  },
  {
    eyebrow: 'Customers',
    title: 'One list that already knows who owes you what',
    body: 'Search, filter and sort straight from the URL, so any view you land on is one you can share or bookmark. Invoiced and outstanding totals sit on the row, and a credit limit warns you before the next order goes out.',
    src: '/product/customers.png',
    alt: 'Flow360 customer list with search, status filter, invoiced and outstanding columns, and per-row actions.',
  },
  {
    eyebrow: 'Customer profile',
    title: 'The whole relationship, without digging through email',
    body: 'Contact details, terms and tax information beside live totals, then tabs for invoices, payments, ledger entries and private notes. Anyone on the team can open a customer and see exactly where things stand.',
    src: '/product/customer-profile.png',
    alt: 'Flow360 customer profile showing totals for invoiced, paid and outstanding amounts with tabs for invoices, payments, transactions and notes.',
  },
];

export function LookInside() {
  return (
    <section
      id="inside"
      className="scroll-mt-20 border-b border-border bg-surface-subtle py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <SectionHeading
          align="center"
          eyebrow="Take a look inside"
          title="The real interface, not an illustration of one"
          lead="Every screen below is a screenshot of the running application. What you see here is what your team opens on a Monday morning."
        />

        <div className="mt-16 space-y-20 md:space-y-28">
          {SHOWCASES.map((showcase, index) => {
            const imageFirst = index % 2 === 1;
            return (
              <article
                key={showcase.src}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
              >
                <Reveal className={cn(imageFirst && 'lg:order-2')}>
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                    {showcase.eyebrow}
                  </p>
                  <h3 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.025em] md:text-[1.75rem]">
                    {showcase.title}
                  </h3>
                  <p className="mt-4 text-pretty text-[14.5px] leading-relaxed text-muted-foreground md:text-[15px]">
                    {showcase.body}
                  </p>
                </Reveal>

                <Reveal delay={90} className={cn(imageFirst && 'lg:order-1')}>
                  <AppFrame
                    src={showcase.src}
                    alt={showcase.alt}
                    width={2800}
                    height={1760}
                  />
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

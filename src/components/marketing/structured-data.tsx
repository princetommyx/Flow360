import { brand, locale } from '@/lib/config/brand';
import { PLANS, PLATFORM_CURRENCY, TRIAL_DAYS, planPrice } from '@/lib/config/plans';
import { absoluteUrl, appOrigin } from '@/lib/url';

/**
 * Structured data, the machine-readable half of a page.
 *
 * Search engines read this to decide what a page *is* rather than guessing
 * from its prose, which is what turns a plain blue link into a result with a
 * price, a rating or an expandable list of questions. Everything here has to
 * be true and present on the page itself: marking up a claim the page does not
 * make is the fastest way to lose the enhanced result altogether.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The content is built here from our own config, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Who publishes this. Repeated on every marketing page, as Google expects. */
export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${appOrigin()}/#organization`,
        name: brand.name,
        url: appOrigin(),
        logo: absoluteUrl(brand.logoUrl ?? '/brand/logomark.png'),
        description: brand.description,
        email: brand.supportEmail,
        areaServed: locale.country,
        contactPoint: {
          '@type': 'ContactPoint',
          email: brand.supportEmail,
          contactType: 'customer support',
          areaServed: locale.country,
          availableLanguage: 'English',
        },
      }}
    />
  );
}

/**
 * What the product is.
 *
 * `offers` carries the cheapest real price, because a range starting at a
 * figure nobody can actually pay is the kind of thing that gets an enhanced
 * result withdrawn.
 */
export function SoftwareSchema() {
  const priced = PLANS.map((plan) => planPrice(plan, 'monthly')).filter(
    (price): price is number => typeof price === 'number' && price > 0,
  );
  const lowest = priced.length > 0 ? Math.min(...priced) : null;

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${appOrigin()}/#software`,
        name: brand.name,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Enterprise Resource Planning',
        operatingSystem: 'Web browser',
        url: appOrigin(),
        description: brand.description,
        publisher: { '@id': `${appOrigin()}/#organization` },
        featureList: [
          'Invoicing and quotations',
          'Customer and supplier records',
          'Inventory and stock control',
          'Purchase orders and bills',
          'Expenses, accounts and transactions',
          'Payroll and attendance',
          'Projects, tasks and timesheets',
          'Sales, expense, inventory and profit and loss reports',
        ],
        ...(lowest === null
          ? {}
          : {
              offers: {
                '@type': 'Offer',
                price: lowest,
                priceCurrency: PLATFORM_CURRENCY,
                category: 'subscription',
                url: absoluteUrl('/pricing'),
                description: `${TRIAL_DAYS}-day free trial, no card required.`,
              },
            }),
      }}
    />
  );
}

/**
 * The questions a page actually answers.
 *
 * Fed from the same array the page renders, so the two cannot drift apart.
 * Marking up an answer a reader cannot see on the page is against Google's
 * guidelines and is treated as spam.
 */
export function FaqSchema({
  questions,
}: {
  questions: Array<{ q: string; a: string }>;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }}
    />
  );
}

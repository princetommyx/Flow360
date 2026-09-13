/**
 * Central brand + product configuration.
 *
 * Everything that identifies the product lives here. Change these values
 * (or the matching NEXT_PUBLIC_* environment variables) and the whole
 * application — marketing site, app shell, emails, PDFs — follows.
 */

export type BrandColorScale = {
  /** Base hue used for buttons, links and active navigation. */
  primary: string;
  /** Supporting hue used for accents, highlights and secondary charts. */
  secondary: string;
};

export type BrandConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  domain: string;
  supportEmail: string;
  colors: BrandColorScale;
  /** Path (relative to /public) or inline mark. `null` uses the built-in logomark. */
  logoUrl: string | null;
  /** Path (relative to /public) of the landing hero photograph, or `null`. */
  heroImageUrl: string | null;
  faviconUrl: string;
  social: { x?: string; linkedin?: string; github?: string };
};

export type LocaleConfig = {
  locale: string;
  currency: string;
  currencySymbol: string;
  country: string;
  countryCode: string;
  timezone: string;
  dateFormat: string;
  /** Default tax rate (percent) applied to new line items. */
  defaultTaxRate: number;
  taxLabel: string;
};

export type DocumentNumberingConfig = {
  invoicePrefix: string;
  quotationPrefix: string;
  paymentPrefix: string;
  purchaseOrderPrefix: string;
  expensePrefix: string;
  payrollPrefix: string;
  /** Zero-padded width of the sequence portion, e.g. 5 -> 00001 */
  padding: number;
  /** Include the year segment, e.g. INV-2026-00001 */
  includeYear: boolean;
};

const env = (key: string, fallback: string) =>
  (process.env[key] ?? '').trim() || fallback;

export const brand: BrandConfig = {
  name: env('NEXT_PUBLIC_BRAND_NAME', 'Flow360'),
  shortName: env('NEXT_PUBLIC_BRAND_SHORT_NAME', 'Flow'),
  tagline: env(
    'NEXT_PUBLIC_BRAND_TAGLINE',
    'Your whole company, on one system',
  ),
  description: env(
    'NEXT_PUBLIC_BRAND_DESCRIPTION',
    'Run sales, purchasing, stock, money and people from a single set of records — so every report reflects the work your team actually did.',
  ),
  domain: env('NEXT_PUBLIC_BRAND_DOMAIN', 'flow360.app'),
  supportEmail: env('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@flow360.app'),
  colors: {
    primary: env('NEXT_PUBLIC_BRAND_PRIMARY', '#4f46e5'),
    secondary: env('NEXT_PUBLIC_BRAND_SECONDARY', '#0d9488'),
  },
  logoUrl: env('NEXT_PUBLIC_BRAND_LOGO', '') || null,
  /**
   * Optional photograph behind the landing hero. It sits under a heavy scrim
   * so the headline keeps its contrast; leave unset for the plain gradient.
   */
  heroImageUrl: env('NEXT_PUBLIC_HERO_IMAGE', '/hero.jpg') || null,
  faviconUrl: env('NEXT_PUBLIC_BRAND_FAVICON', '/favicon.svg'),
  social: {},
};

export const locale: LocaleConfig = {
  locale: env('NEXT_PUBLIC_LOCALE', 'en-US'),
  currency: env('NEXT_PUBLIC_CURRENCY', 'USD'),
  currencySymbol: env('NEXT_PUBLIC_CURRENCY_SYMBOL', '$'),
  country: env('NEXT_PUBLIC_COUNTRY', 'United States'),
  countryCode: env('NEXT_PUBLIC_COUNTRY_CODE', 'US'),
  timezone: env('NEXT_PUBLIC_TIMEZONE', 'UTC'),
  dateFormat: env('NEXT_PUBLIC_DATE_FORMAT', 'dd MMM yyyy'),
  defaultTaxRate: Number(env('NEXT_PUBLIC_DEFAULT_TAX_RATE', '10')),
  taxLabel: env('NEXT_PUBLIC_TAX_LABEL', 'Sales Tax'),
};

export const numbering: DocumentNumberingConfig = {
  invoicePrefix: env('NEXT_PUBLIC_INVOICE_PREFIX', 'INV'),
  quotationPrefix: env('NEXT_PUBLIC_QUOTATION_PREFIX', 'QTE'),
  paymentPrefix: env('NEXT_PUBLIC_PAYMENT_PREFIX', 'PAY'),
  purchaseOrderPrefix: env('NEXT_PUBLIC_PO_PREFIX', 'PO'),
  expensePrefix: env('NEXT_PUBLIC_EXPENSE_PREFIX', 'EXP'),
  payrollPrefix: env('NEXT_PUBLIC_PAYROLL_PREFIX', 'PR'),
  padding: Number(env('NEXT_PUBLIC_NUMBER_PADDING', '5')),
  includeYear: env('NEXT_PUBLIC_NUMBER_INCLUDE_YEAR', 'true') !== 'false',
};

/** Marketing-side company facts, kept out of components. */
export const company = {
  legalName: env('NEXT_PUBLIC_COMPANY_LEGAL_NAME', 'Flow360 Software Ltd.'),
  addressLine1: env('NEXT_PUBLIC_COMPANY_ADDRESS_1', '400 Market Street'),
  addressLine2: env('NEXT_PUBLIC_COMPANY_ADDRESS_2', 'Suite 1200'),
  city: env('NEXT_PUBLIC_COMPANY_CITY', 'San Francisco'),
  state: env('NEXT_PUBLIC_COMPANY_STATE', 'CA'),
  postalCode: env('NEXT_PUBLIC_COMPANY_POSTAL', '94111'),
  country: env('NEXT_PUBLIC_COMPANY_COUNTRY', 'United States'),
  phone: env('NEXT_PUBLIC_COMPANY_PHONE', '+1 (415) 555-0134'),
  taxId: env('NEXT_PUBLIC_COMPANY_TAX_ID', 'US-882-441-901'),
} as const;

export const appConfig = { brand, locale, numbering, company } as const;

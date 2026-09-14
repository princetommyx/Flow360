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

/**
 * Every public variable, read by literal member access.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_FOO` into the browser bundle only
 * when the property is written out literally. A computed read —
 * `process.env[key]` — is left alone, so it resolves on the server and comes
 * back undefined in the browser. That silently ignored every branding override
 * client-side while the server honoured it, and any value differing from its
 * fallback then produced a hydration mismatch that React refuses to patch.
 *
 * Listing the keys is the price of having them work in both places. A new
 * variable has to be added here as well as used below, and the type forces it.
 */
const PUBLIC_ENV = {
  NEXT_PUBLIC_BRAND_DESCRIPTION: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION,
  NEXT_PUBLIC_BRAND_DOMAIN: process.env.NEXT_PUBLIC_BRAND_DOMAIN,
  NEXT_PUBLIC_BRAND_FAVICON: process.env.NEXT_PUBLIC_BRAND_FAVICON,
  NEXT_PUBLIC_BRAND_LOGO: process.env.NEXT_PUBLIC_BRAND_LOGO,
  NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  NEXT_PUBLIC_BRAND_PRIMARY: process.env.NEXT_PUBLIC_BRAND_PRIMARY,
  NEXT_PUBLIC_BRAND_SECONDARY: process.env.NEXT_PUBLIC_BRAND_SECONDARY,
  NEXT_PUBLIC_BRAND_TAGLINE: process.env.NEXT_PUBLIC_BRAND_TAGLINE,
  NEXT_PUBLIC_BRAND_SHORT_NAME: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME,
  NEXT_PUBLIC_COMPANY_ADDRESS_1: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_1,
  NEXT_PUBLIC_COMPANY_ADDRESS_2: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_2,
  NEXT_PUBLIC_COMPANY_CITY: process.env.NEXT_PUBLIC_COMPANY_CITY,
  NEXT_PUBLIC_COMPANY_COUNTRY: process.env.NEXT_PUBLIC_COMPANY_COUNTRY,
  NEXT_PUBLIC_COMPANY_LEGAL_NAME: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME,
  NEXT_PUBLIC_COMPANY_PHONE: process.env.NEXT_PUBLIC_COMPANY_PHONE,
  NEXT_PUBLIC_COMPANY_POSTAL: process.env.NEXT_PUBLIC_COMPANY_POSTAL,
  NEXT_PUBLIC_COMPANY_STATE: process.env.NEXT_PUBLIC_COMPANY_STATE,
  NEXT_PUBLIC_COMPANY_TAX_ID: process.env.NEXT_PUBLIC_COMPANY_TAX_ID,
  NEXT_PUBLIC_COUNTRY: process.env.NEXT_PUBLIC_COUNTRY,
  NEXT_PUBLIC_COUNTRY_CODE: process.env.NEXT_PUBLIC_COUNTRY_CODE,
  NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
  NEXT_PUBLIC_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL,
  NEXT_PUBLIC_DATE_FORMAT: process.env.NEXT_PUBLIC_DATE_FORMAT,
  NEXT_PUBLIC_DEFAULT_TAX_RATE: process.env.NEXT_PUBLIC_DEFAULT_TAX_RATE,
  NEXT_PUBLIC_EXPENSE_PREFIX: process.env.NEXT_PUBLIC_EXPENSE_PREFIX,
  NEXT_PUBLIC_HERO_IMAGE: process.env.NEXT_PUBLIC_HERO_IMAGE,
  NEXT_PUBLIC_INVOICE_PREFIX: process.env.NEXT_PUBLIC_INVOICE_PREFIX,
  NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
  NEXT_PUBLIC_NUMBER_INCLUDE_YEAR: process.env.NEXT_PUBLIC_NUMBER_INCLUDE_YEAR,
  NEXT_PUBLIC_NUMBER_PADDING: process.env.NEXT_PUBLIC_NUMBER_PADDING,
  NEXT_PUBLIC_PAYMENT_PREFIX: process.env.NEXT_PUBLIC_PAYMENT_PREFIX,
  NEXT_PUBLIC_PAYROLL_PREFIX: process.env.NEXT_PUBLIC_PAYROLL_PREFIX,
  NEXT_PUBLIC_PO_PREFIX: process.env.NEXT_PUBLIC_PO_PREFIX,
  NEXT_PUBLIC_QUOTATION_PREFIX: process.env.NEXT_PUBLIC_QUOTATION_PREFIX,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  NEXT_PUBLIC_TAX_LABEL: process.env.NEXT_PUBLIC_TAX_LABEL,
  NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
} as const;

const env = (key: keyof typeof PUBLIC_ENV, fallback: string) =>
  (PUBLIC_ENV[key] ?? '').trim() || fallback;

export const brand: BrandConfig = {
  name: env('NEXT_PUBLIC_BRAND_NAME', 'Adwuma360'),
  shortName: env('NEXT_PUBLIC_BRAND_SHORT_NAME', 'Flow'),
  tagline: env(
    'NEXT_PUBLIC_BRAND_TAGLINE',
    'Your whole company, on one system',
  ),
  description: env(
    'NEXT_PUBLIC_BRAND_DESCRIPTION',
    'Run sales, purchasing, stock, money and people from a single set of records — so every report reflects the work your team actually did.',
  ),
  domain: env('NEXT_PUBLIC_BRAND_DOMAIN', 'adwuma360.app'),
  supportEmail: env('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@adwuma360.app'),
  colors: {
    // Sampled from the logomark: its action blue and its navy.
    primary: env('NEXT_PUBLIC_BRAND_PRIMARY', '#2563eb'),
    secondary: env('NEXT_PUBLIC_BRAND_SECONDARY', '#0c3060'),
  },
  logoUrl: env('NEXT_PUBLIC_BRAND_LOGO', '/brand/logomark.png') || null,
  /**
   * Optional photograph behind the landing hero. It sits under a heavy scrim
   * so the headline keeps its contrast; leave unset for the plain gradient.
   */
  heroImageUrl: env('NEXT_PUBLIC_HERO_IMAGE', '/product/hero.jpg') || null,
  faviconUrl: env('NEXT_PUBLIC_BRAND_FAVICON', '/brand/favicon.png'),
  social: {},
};

export const locale: LocaleConfig = {
  locale: env('NEXT_PUBLIC_LOCALE', 'en-US'),
  currency: env('NEXT_PUBLIC_CURRENCY', 'USD'),
  currencySymbol: env('NEXT_PUBLIC_CURRENCY_SYMBOL', '$'),
  country: env('NEXT_PUBLIC_COUNTRY', 'Ghana'),
  countryCode: env('NEXT_PUBLIC_COUNTRY_CODE', 'GH'),
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

/**
 * Marketing-side company facts, kept out of components.
 *
 * Placeholders. Every one is overridable by environment variable, and they
 * should be replaced with the real registered details before the site is used
 * commercially — an address and tax number appear on invoices.
 */
export const company = {
  legalName: env('NEXT_PUBLIC_COMPANY_LEGAL_NAME', 'Adwuma360 Software Ltd.'),
  addressLine1: env('NEXT_PUBLIC_COMPANY_ADDRESS_1', 'Ring Road Central'),
  addressLine2: env('NEXT_PUBLIC_COMPANY_ADDRESS_2', 'Accra Central'),
  city: env('NEXT_PUBLIC_COMPANY_CITY', 'Accra'),
  state: env('NEXT_PUBLIC_COMPANY_STATE', 'Greater Accra'),
  // GhanaPost digital address rather than a postcode, which Ghana does not use.
  postalCode: env('NEXT_PUBLIC_COMPANY_POSTAL', 'GA-145-2401'),
  country: env('NEXT_PUBLIC_COMPANY_COUNTRY', 'Ghana'),
  phone: env('NEXT_PUBLIC_COMPANY_PHONE', '+233 30 123 4567'),
  taxId: env('NEXT_PUBLIC_COMPANY_TAX_ID', 'C0012345678'),
} as const;

export const appConfig = { brand, locale, numbering, company } as const;

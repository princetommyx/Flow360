/**
 * Country reference data used by sign-up and company settings.
 *
 * Selecting a country sets the dial code and the default currency, so a new
 * workspace starts with sensible locale settings rather than US defaults.
 * Deliberately a curated list rather than the full ISO set — every entry here
 * is one the product is actually configured for.
 */
export type Country = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  /** E.164 dial prefix, without the leading plus */
  dialCode: string;
  /** ISO 4217 default currency */
  currency: string;
};

export const COUNTRIES: Country[] = [
  { code: 'KE', name: 'Kenya', dialCode: '254', currency: 'KES' },
  { code: 'NG', name: 'Nigeria', dialCode: '234', currency: 'NGN' },
  { code: 'GH', name: 'Ghana', dialCode: '233', currency: 'GHS' },
  { code: 'TZ', name: 'Tanzania', dialCode: '255', currency: 'TZS' },
  { code: 'UG', name: 'Uganda', dialCode: '256', currency: 'UGX' },
  { code: 'RW', name: 'Rwanda', dialCode: '250', currency: 'RWF' },
  { code: 'ZA', name: 'South Africa', dialCode: '27', currency: 'ZAR' },
  { code: 'EG', name: 'Egypt', dialCode: '20', currency: 'EGP' },
  { code: 'MA', name: 'Morocco', dialCode: '212', currency: 'MAD' },
  { code: 'ET', name: 'Ethiopia', dialCode: '251', currency: 'ETB' },
  { code: 'ZM', name: 'Zambia', dialCode: '260', currency: 'ZMW' },
  { code: 'BW', name: 'Botswana', dialCode: '267', currency: 'BWP' },
  { code: 'US', name: 'United States', dialCode: '1', currency: 'USD' },
  { code: 'CA', name: 'Canada', dialCode: '1', currency: 'CAD' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', currency: 'GBP' },
  { code: 'IE', name: 'Ireland', dialCode: '353', currency: 'EUR' },
  { code: 'DE', name: 'Germany', dialCode: '49', currency: 'EUR' },
  { code: 'FR', name: 'France', dialCode: '33', currency: 'EUR' },
  { code: 'ES', name: 'Spain', dialCode: '34', currency: 'EUR' },
  { code: 'IT', name: 'Italy', dialCode: '39', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', dialCode: '31', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', dialCode: '32', currency: 'EUR' },
  { code: 'PT', name: 'Portugal', dialCode: '351', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', dialCode: '46', currency: 'SEK' },
  { code: 'NO', name: 'Norway', dialCode: '47', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', dialCode: '45', currency: 'DKK' },
  { code: 'PL', name: 'Poland', dialCode: '48', currency: 'PLN' },
  { code: 'CH', name: 'Switzerland', dialCode: '41', currency: 'CHF' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '971', currency: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '966', currency: 'SAR' },
  { code: 'QA', name: 'Qatar', dialCode: '974', currency: 'QAR' },
  { code: 'TR', name: 'Türkiye', dialCode: '90', currency: 'TRY' },
  { code: 'IN', name: 'India', dialCode: '91', currency: 'INR' },
  { code: 'PK', name: 'Pakistan', dialCode: '92', currency: 'PKR' },
  { code: 'BD', name: 'Bangladesh', dialCode: '880', currency: 'BDT' },
  { code: 'SG', name: 'Singapore', dialCode: '65', currency: 'SGD' },
  { code: 'MY', name: 'Malaysia', dialCode: '60', currency: 'MYR' },
  { code: 'ID', name: 'Indonesia', dialCode: '62', currency: 'IDR' },
  { code: 'PH', name: 'Philippines', dialCode: '63', currency: 'PHP' },
  { code: 'TH', name: 'Thailand', dialCode: '66', currency: 'THB' },
  { code: 'VN', name: 'Vietnam', dialCode: '84', currency: 'VND' },
  { code: 'CN', name: 'China', dialCode: '86', currency: 'CNY' },
  { code: 'JP', name: 'Japan', dialCode: '81', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', dialCode: '82', currency: 'KRW' },
  { code: 'AU', name: 'Australia', dialCode: '61', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', dialCode: '64', currency: 'NZD' },
  { code: 'BR', name: 'Brazil', dialCode: '55', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', dialCode: '52', currency: 'MXN' },
  { code: 'AR', name: 'Argentina', dialCode: '54', currency: 'ARS' },
  { code: 'CL', name: 'Chile', dialCode: '56', currency: 'CLP' },
  { code: 'CO', name: 'Colombia', dialCode: '57', currency: 'COP' },
];

export const COUNTRY_CODES = COUNTRIES.map((country) => country.code);

export function findCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((country) => country.code === code.toUpperCase());
}

/** Dial codes, de-duplicated and ordered, for the phone prefix picker. */
export const DIAL_CODES = Array.from(
  new Map(
    COUNTRIES.map((country) => [
      country.dialCode,
      { dialCode: country.dialCode, label: `+${country.dialCode}`, country: country.name },
    ]),
  ).values(),
).sort((a, b) => Number(a.dialCode) - Number(b.dialCode));

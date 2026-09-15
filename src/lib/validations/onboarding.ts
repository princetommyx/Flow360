import { z } from 'zod';

import { COUNTRY_CODES } from '@/lib/config/countries';

/**
 * The first thing a new account is asked for.
 *
 * Deliberately short. Everything else about a company can be filled in later
 * from settings, and a long form between someone and the product they have
 * just signed up for is the fastest way to lose them. The country is here
 * because it sets the currency the books are kept in, which is painful to
 * change once there are figures in them.
 */
export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, 'Enter your business name')
    .max(80, 'That name is too long'),
  countryCode: z
    .string()
    .trim()
    .length(2, 'Choose your country')
    .refine((value) => COUNTRY_CODES.includes(value.toUpperCase()), {
      message: 'Choose a country from the list',
    }),
  dialCode: z.string().trim().min(1, 'Choose a dial code').max(4),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter a phone number')
    .max(20)
    .regex(/^[0-9\s-]+$/, 'Use digits only'),
  industry: z.string().trim().max(60).optional().or(z.literal('')),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

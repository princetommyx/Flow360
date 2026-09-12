import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name').max(80),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Use a 3-letter currency code such as USD'),
  country: z.string().trim().min(2, 'Enter a country').max(60),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name').max(80),
  legalName: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  website: z.string().trim().max(120).optional().or(z.literal('')),
  taxId: z.string().trim().max(60).optional().or(z.literal('')),
  addressLine1: z.string().trim().max(120).optional().or(z.literal('')),
  addressLine2: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().max(60).optional().or(z.literal('')),
  state: z.string().trim().max(60).optional().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().trim().min(2).max(60),
  currency: z.string().trim().toUpperCase().length(3),
  timezone: z.string().trim().max(60),
  logoUrl: z.string().trim().max(400).optional().or(z.literal('')),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use a hex colour such as #4f46e5')
    .optional()
    .or(z.literal('')),
  secondaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use a hex colour such as #0d9488')
    .optional()
    .or(z.literal('')),
});
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

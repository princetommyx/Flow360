import { z } from 'zod';

import { COUNTRY_CODES } from '@/lib/config/countries';

const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128, 'That password is too long')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, 'Enter your company name')
      .max(80),
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
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  jobTitle: z.string().trim().max(80).optional().or(z.literal('')),
});
export type ProfileInput = z.infer<typeof profileSchema>;

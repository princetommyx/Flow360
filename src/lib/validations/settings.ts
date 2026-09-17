import { z } from 'zod';

import { INVOICE_TEMPLATE_IDS } from '@/lib/config/invoice-templates';

/**
 * Workspace settings.
 *
 * Split by the page that owns each group rather than one schema for the whole
 * `CompanySettings` row, so saving the tax page cannot quietly rewrite the
 * numbering someone else was editing.
 */

const prefix = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Give it a prefix')
  .max(8, 'Eight characters at most')
  .regex(/^[A-Z0-9-]+$/, 'Letters, numbers and dashes only');

export const invoicingSchema = z.object({
  invoicePrefix: prefix,
  quotationPrefix: prefix,
  paymentPrefix: prefix,
  purchaseOrderPrefix: prefix,
  numberPadding: z
    .number({ message: 'Choose how many digits' })
    .int()
    .min(1, 'At least one digit')
    .max(10, 'Ten digits at most'),
  numberIncludeYear: z.boolean(),
  defaultPaymentTermDays: z
    .number({ message: 'Enter the days' })
    .int()
    .min(0, 'Cannot be negative')
    .max(365, 'A year at most'),
  defaultInvoiceNotes: z.string().trim().max(2000).optional().or(z.literal('')),
  paymentInstructions: z.string().trim().max(2000).optional().or(z.literal('')),
  invoiceFooter: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type InvoicingInput = z.infer<typeof invoicingSchema>;

/**
 * Choosing the printed design.
 *
 * It is one field and its own schema, saved from its own page, because the
 * invoicing form must not be able to reset it and this must not be able to
 * reset the numbering. The id has to name a real design; whether this
 * workspace's plan includes it is a question only the server can answer, and
 * the action asks it after this.
 */
export const invoiceTemplateSchema = z.object({
  invoiceTemplate: z.enum(INVOICE_TEMPLATE_IDS, { message: 'Choose a design' }),
});

export type InvoiceTemplateInput = z.infer<typeof invoiceTemplateSchema>;

export const taxSettingsSchema = z.object({
  taxLabel: z.string().trim().min(1, 'Give the tax a name').max(40),
  defaultTaxRate: z
    .number({ message: 'Enter a rate' })
    .min(0, 'Cannot be negative')
    .max(100, 'Use 100% or less'),
  pricesIncludeTax: z.boolean(),
});

export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>;

export const taxRateSchema = z.object({
  name: z.string().trim().min(1, 'Give the rate a name').max(60),
  rate: z
    .number({ message: 'Enter a rate' })
    .min(0, 'Cannot be negative')
    .max(100, 'Use 100% or less'),
  isDefault: z.boolean(),
  isCompound: z.boolean(),
  isActive: z.boolean(),
});

export type TaxRateInput = z.infer<typeof taxRateSchema>;

export const notificationSettingsSchema = z.object({
  notifyOnInvoicePaid: z.boolean(),
  notifyOnQuoteAccepted: z.boolean(),
  notifyOnOverdue: z.boolean(),
  notifyOnLowStock: z.boolean(),
  lowStockAlerts: z.boolean(),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;

/**
 * Inviting someone into the workspace.
 *
 * The role is a key rather than a free string: it has to resolve to a `Role`
 * row belonging to this organization, which the action checks.
 */
export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2, 'Enter their name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  roleId: z.string().min(1, 'Choose a role'),
  jobTitle: z.string().trim().max(80).optional().or(z.literal('')),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const memberRoleSchema = z.object({
  memberId: z.string().min(1),
  roleId: z.string().min(1, 'Choose a role'),
});

export type MemberRoleInput = z.infer<typeof memberRoleSchema>;

export const roleSchema = z.object({
  name: z.string().trim().min(2, 'Give the role a name').max(60),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  permissions: z.array(z.string()).max(200),
});

export type RoleInput = z.infer<typeof roleSchema>;

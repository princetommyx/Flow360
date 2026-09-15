import 'server-only';

import { db } from '@/lib/db';
import { toNumber } from '@/lib/money';

/**
 * Reads behind the settings pages.
 *
 * `CompanySettings` is created with the organization, but a workspace restored
 * from an older backup may not have the row. Reading through `settingsFor`
 * means a missing row renders the schema defaults rather than a crash, and the
 * first save writes it properly through the upsert in the action.
 */

const DEFAULTS = {
  invoicePrefix: 'INV',
  quotationPrefix: 'QTE',
  paymentPrefix: 'PAY',
  purchaseOrderPrefix: 'PO',
  numberPadding: 5,
  numberIncludeYear: true,
  defaultPaymentTermDays: 14,
  defaultInvoiceNotes: '',
  paymentInstructions: '',
  invoiceFooter: '',
  taxLabel: 'VAT',
  defaultTaxRate: 0,
  pricesIncludeTax: false,
  lowStockAlerts: true,
  notifyOnInvoicePaid: true,
  notifyOnLowStock: true,
  notifyOnQuoteAccepted: true,
  notifyOnOverdue: true,
};

export type WorkspaceSettings = typeof DEFAULTS;

export async function settingsFor(organizationId: string): Promise<WorkspaceSettings> {
  const row = await db.companySettings.findUnique({
    where: { organizationId },
    select: {
      invoicePrefix: true,
      quotationPrefix: true,
      paymentPrefix: true,
      purchaseOrderPrefix: true,
      numberPadding: true,
      numberIncludeYear: true,
      defaultPaymentTermDays: true,
      defaultInvoiceNotes: true,
      paymentInstructions: true,
      invoiceFooter: true,
      taxLabel: true,
      defaultTaxRate: true,
      pricesIncludeTax: true,
      lowStockAlerts: true,
      notifyOnInvoicePaid: true,
      notifyOnLowStock: true,
      notifyOnQuoteAccepted: true,
      notifyOnOverdue: true,
    },
  });

  if (!row) return { ...DEFAULTS };

  return {
    ...row,
    defaultInvoiceNotes: row.defaultInvoiceNotes ?? '',
    paymentInstructions: row.paymentInstructions ?? '',
    invoiceFooter: row.invoiceFooter ?? '',
    defaultTaxRate: toNumber(row.defaultTaxRate),
  };
}

export type TaxRateRow = {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isCompound: boolean;
  isActive: boolean;
};

export async function listTaxRates(organizationId: string): Promise<TaxRateRow[]> {
  const rows = await db.taxRate.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      rate: true,
      isDefault: true,
      isCompound: true,
      isActive: true,
    },
  });

  return rows.map((row) => ({ ...row, rate: toNumber(row.rate) }));
}

export type MemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  status: string;
  isOwner: boolean;
  roleId: string;
  roleName: string;
  joinedAt: string | null;
  invitedAt: string | null;
  lastLoginAt: string | null;
};

/** Everyone attached to the workspace, owners first, then alphabetically. */
export async function listMembers(organizationId: string): Promise<MemberRow[]> {
  const rows = await db.organizationMember.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      status: true,
      isOwner: true,
      roleId: true,
      invitedAt: true,
      joinedAt: true,
      role: { select: { name: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          avatarUrl: true,
          lastLoginAt: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    jobTitle: row.user.jobTitle,
    avatarUrl: row.user.avatarUrl,
    status: row.status,
    isOwner: row.isOwner,
    roleId: row.roleId,
    roleName: row.role.name,
    joinedAt: row.joinedAt?.toISOString() ?? null,
    invitedAt: row.invitedAt?.toISOString() ?? null,
    lastLoginAt: row.user.lastLoginAt?.toISOString() ?? null,
  }));
}

export type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  /** Permission keys, not ids: the matrix and every guard speak in keys. */
  permissions: string[];
  memberCount: number;
};

export async function listRoles(organizationId: string): Promise<RoleRow[]> {
  const rows = await db.role.findMany({
    where: { organizationId },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isSystem: true,
      permissions: { select: { permission: { select: { key: true } } } },
      _count: { select: { members: { where: { deletedAt: null } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? '',
    isSystem: row.isSystem,
    permissions: row.permissions.map((rp) => rp.permission.key),
    memberCount: row._count.members,
  }));
}

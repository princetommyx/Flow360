// Pure transaction helpers — no request context — so the seed script can
// reuse them. Deliberately not marked `server-only`.
import type { Prisma } from '@/generated/prisma/client';
import {
  ROLE_TEMPLATES,
  allPermissionKeys,
  resolveTemplatePermissions,
} from '@/lib/permissions';
import { locale, numbering } from '@/lib/config/brand';
import { TRIAL_DAYS } from '@/lib/config/plans';

/**
 * Makes sure the global permission catalogue exists. Idempotent, so it is safe
 * to call on every organization creation and from the seed script.
 */
export async function ensurePermissionCatalogue(tx: Prisma.TransactionClient) {
  const keys = allPermissionKeys();
  const existing = await tx.permission.findMany({
    where: { key: { in: keys } },
    select: { key: true },
  });
  const known = new Set(existing.map((row) => row.key));
  const missing = keys.filter((key) => !known.has(key));

  if (missing.length > 0) {
    await tx.permission.createMany({
      data: missing.map((key) => {
        const [module, action] = key.split('.');
        return { key, module, action };
      }),
      skipDuplicates: true,
    });
  }
}

/**
 * Creates a tenant with everything it needs to be usable straight away:
 * the six built-in roles with their permissions, company settings, a default
 * tax rate, a cash account and an owner membership.
 */
export async function provisionOrganization(
  tx: Prisma.TransactionClient,
  input: {
    name: string;
    slug: string;
    ownerUserId: string;
    currency?: string;
    country?: string;
    email?: string | null;
  },
) {
  await ensurePermissionCatalogue(tx);

  const organization = await tx.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      currency: input.currency ?? locale.currency,
      country: input.country ?? locale.country,
      timezone: locale.timezone,
      email: input.email ?? null,
      // Every workspace starts on a full-featured trial.
      plan: 'business',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
      settings: {
        create: {
          invoicePrefix: numbering.invoicePrefix,
          quotationPrefix: numbering.quotationPrefix,
          paymentPrefix: numbering.paymentPrefix,
          purchaseOrderPrefix: numbering.purchaseOrderPrefix,
          numberPadding: numbering.padding,
          numberIncludeYear: numbering.includeYear,
          taxLabel: locale.taxLabel,
          defaultTaxRate: locale.defaultTaxRate,
          paymentInstructions:
            'Please reference the invoice number with your payment so we can match it automatically.',
          invoiceFooter: 'Thank you for your business.',
        },
      },
    },
    select: { id: true },
  });

  const permissions = await tx.permission.findMany({ select: { id: true, key: true } });
  const permissionIdByKey = new Map(permissions.map((row) => [row.key, row.id]));

  const roleIdByKey = new Map<string, string>();
  for (const template of ROLE_TEMPLATES) {
    const role = await tx.role.create({
      data: {
        organizationId: organization.id,
        key: template.key,
        name: template.name,
        description: template.description,
        isSystem: true,
      },
      select: { id: true },
    });
    roleIdByKey.set(template.key, role.id);

    const keys = resolveTemplatePermissions(template.key);
    await tx.rolePermission.createMany({
      data: keys
        .map((key) => permissionIdByKey.get(key))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }

  await tx.organizationMember.create({
    data: {
      organizationId: organization.id,
      userId: input.ownerUserId,
      roleId: roleIdByKey.get('owner')!,
      isOwner: true,
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  });

  await tx.branch.create({
    data: {
      organizationId: organization.id,
      name: 'Head office',
      code: 'HQ',
      isPrimary: true,
      country: input.country ?? locale.country,
    },
  });

  await tx.taxRate.create({
    data: {
      organizationId: organization.id,
      name: locale.taxLabel,
      rate: locale.defaultTaxRate,
      isDefault: true,
    },
  });

  await tx.account.createMany({
    data: [
      {
        organizationId: organization.id,
        name: 'Main business account',
        type: 'BANK',
        currency: input.currency ?? locale.currency,
        isPrimary: true,
      },
      {
        organizationId: organization.id,
        name: 'Petty cash',
        type: 'CASH',
        currency: input.currency ?? locale.currency,
      },
    ],
  });

  await tx.expenseCategory.createMany({
    data: [
      'Rent & facilities',
      'Software & subscriptions',
      'Travel',
      'Marketing',
      'Professional services',
      'Utilities',
      'Equipment',
      'Office supplies',
    ].map((name) => ({ organizationId: organization.id, name })),
    skipDuplicates: true,
  });

  return { organizationId: organization.id, roleIdByKey };
}

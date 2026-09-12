'use server';

import { db } from '@/lib/db';
import { getTenantContext } from '@/server/tenant';
import { hasPermission } from '@/lib/permissions';

export type SearchHit = {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  href: string;
};

/**
 * Cross-module search behind the ⌘K palette.
 *
 * Every branch is scoped to the caller's organization and gated on the same
 * permissions as the corresponding module page.
 */
export async function globalSearch(term: string): Promise<SearchHit[]> {
  const query = term.trim();
  if (query.length < 2) return [];

  const context = await getTenantContext();
  if (!context) return [];

  const organizationId = context.organization.id;
  const can = (permission: Parameters<typeof hasPermission>[1]) =>
    hasPermission(context.permissions, permission);

  const contains = { contains: query, mode: 'insensitive' as const };
  const take = 5;

  const [customers, invoices, products, quotations, suppliers, projects] =
    await Promise.all([
      can('customers.view')
        ? db.customer.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ name: contains }, { companyName: contains }, { email: contains }],
            },
            select: { id: true, name: true, companyName: true, email: true },
            take,
          })
        : [],
      can('invoices.view')
        ? db.invoice.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ number: contains }, { customer: { name: contains } }],
            },
            select: {
              id: true,
              number: true,
              status: true,
              customer: { select: { name: true } },
            },
            take,
          })
        : [],
      can('products.view')
        ? db.product.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ name: contains }, { sku: contains }],
            },
            select: { id: true, name: true, sku: true },
            take,
          })
        : [],
      can('quotations.view')
        ? db.quotation.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ number: contains }, { customer: { name: contains } }],
            },
            select: {
              id: true,
              number: true,
              customer: { select: { name: true } },
            },
            take,
          })
        : [],
      can('suppliers.view')
        ? db.supplier.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ name: contains }, { companyName: contains }],
            },
            select: { id: true, name: true, companyName: true },
            take,
          })
        : [],
      can('projects.view')
        ? db.project.findMany({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ name: contains }, { code: contains }],
            },
            select: { id: true, name: true, code: true },
            take,
          })
        : [],
    ]);

  return [
    ...customers.map((row) => ({
      id: `customer-${row.id}`,
      group: 'Customers',
      title: row.name,
      subtitle: row.companyName ?? row.email ?? undefined,
      href: `/customers/${row.id}`,
    })),
    ...invoices.map((row) => ({
      id: `invoice-${row.id}`,
      group: 'Invoices',
      title: row.number,
      subtitle: row.customer.name,
      href: `/invoices/${row.id}`,
    })),
    ...quotations.map((row) => ({
      id: `quotation-${row.id}`,
      group: 'Quotations',
      title: row.number,
      subtitle: row.customer.name,
      href: `/quotations/${row.id}`,
    })),
    ...products.map((row) => ({
      id: `product-${row.id}`,
      group: 'Products',
      title: row.name,
      subtitle: row.sku,
      href: `/products/${row.id}`,
    })),
    ...suppliers.map((row) => ({
      id: `supplier-${row.id}`,
      group: 'Suppliers',
      title: row.name,
      subtitle: row.companyName ?? undefined,
      href: `/suppliers/${row.id}`,
    })),
    ...projects.map((row) => ({
      id: `project-${row.id}`,
      group: 'Projects',
      title: row.name,
      subtitle: row.code,
      href: `/projects/${row.id}`,
    })),
  ];
}

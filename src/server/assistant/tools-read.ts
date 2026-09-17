import 'server-only';

import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { z } from 'zod';

import { db } from '@/lib/db';
import { formatCurrency, round, toNumber } from '@/lib/money';
import {
  dateString,
  defineTool,
  resolveEmployee,
  toolData,
  toolError,
  type ToolContext,
} from '@/server/assistant/context';

/**
 * The tools that only look.
 *
 * They run without asking anyone, because reading is what the person could do
 * themselves by clicking around, and a chat that stops to confirm a lookup is
 * not worth talking to. Everything is scoped to the workspace and gated on the
 * same permission the corresponding page is.
 *
 * Every figure comes back formatted as well as raw. The model quoting
 * `GH₵4,520.00` back to somebody beats it formatting `4520` itself and choosing
 * the wrong symbol.
 */

const money = (value: unknown, context: ToolContext) =>
  formatCurrency(toNumber(value as number), { currency: context.currency });

export const searchCustomers = defineTool({
  name: 'search_customers',
  description:
    'Find customers by name, company or email, with what each of them owes. Call with no query to list the most recent.',
  permission: 'customers.view',
  writes: false,
  schema: z.object({
    query: z.string().max(80).optional().describe('Part of a name, company or email address'),
    limit: z.number().int().min(1).max(25).optional(),
  }),
  async run(input, context) {
    const rows = await db.customer.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        ...(input.query
          ? {
              OR: [
                { name: { contains: input.query, mode: 'insensitive' as const } },
                { companyName: { contains: input.query, mode: 'insensitive' as const } },
                { email: { contains: input.query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: input.limit ?? 10,
      select: {
        name: true,
        companyName: true,
        email: true,
        phone: true,
        city: true,
        status: true,
        paymentTermDays: true,
        invoices: {
          where: { deletedAt: null, status: { notIn: ['DRAFT', 'CANCELLED'] } },
          select: { balanceDue: true },
        },
      },
    });

    return toolData({
      customers: rows.map((row) => {
        const owed = round(row.invoices.reduce((total, i) => total + toNumber(i.balanceDue), 0));
        return {
          name: row.name,
          company: row.companyName,
          email: row.email,
          phone: row.phone,
          city: row.city,
          status: row.status,
          paymentTermDays: row.paymentTermDays,
          outstanding: owed,
          outstandingFormatted: money(owed, context),
        };
      }),
    });
  },
});

export const searchProducts = defineTool({
  name: 'search_products',
  description:
    'Find products and services by name or code, with their price, tax rate and stock on hand.',
  permission: 'products.view',
  writes: false,
  schema: z.object({
    query: z.string().max(80).optional(),
    lowStockOnly: z.boolean().optional().describe('Only those at or below their reorder level'),
    limit: z.number().int().min(1).max(25).optional(),
  }),
  async run(input, context) {
    const rows = await db.product.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        ...(input.query
          ? {
              OR: [
                { name: { contains: input.query, mode: 'insensitive' as const } },
                { sku: { contains: input.query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: input.limit ?? 10,
      select: {
        sku: true,
        name: true,
        type: true,
        unit: true,
        sellingPrice: true,
        purchasePrice: true,
        taxRate: true,
        stockQuantity: true,
        minStockLevel: true,
        trackInventory: true,
        status: true,
        category: { select: { name: true } },
      },
    });

    const mapped = rows
      .map((row) => ({
        code: row.sku,
        name: row.name,
        type: row.type,
        category: row.category?.name ?? null,
        unit: row.unit,
        sellingPrice: toNumber(row.sellingPrice),
        sellingPriceFormatted: money(row.sellingPrice, context),
        costPrice: toNumber(row.purchasePrice),
        taxRate: toNumber(row.taxRate),
        stock: row.trackInventory ? toNumber(row.stockQuantity) : null,
        reorderLevel: row.trackInventory ? toNumber(row.minStockLevel) : null,
        status: row.status,
      }))
      .filter(
        (row) =>
          !input.lowStockOnly ||
          (row.stock !== null && row.reorderLevel !== null && row.stock <= row.reorderLevel),
      );

    return toolData({ products: mapped });
  },
});

export const listInvoices = defineTool({
  name: 'list_invoices',
  description:
    'List invoices, newest first. Filter by status, by customer, by date, or to only those overdue.',
  permission: 'invoices.view',
  writes: false,
  schema: z.object({
    customer: z.string().max(80).optional().describe('Customer name, whole or partial'),
    status: z
      .enum(['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'])
      .optional(),
    unpaidOnly: z.boolean().optional().describe('Anything still owing'),
    overdueOnly: z.boolean().optional().describe('Past its due date and still owing'),
    from: dateString.optional().describe('Issued on or after'),
    to: dateString.optional().describe('Issued on or before'),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  async run(input, context) {
    const rows = await db.invoice.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        ...(input.status ? { status: input.status } : {}),
        ...(input.unpaidOnly || input.overdueOnly
          ? { balanceDue: { gt: 0 }, status: { notIn: ['DRAFT', 'CANCELLED'] } }
          : {}),
        ...(input.overdueOnly ? { dueDate: { lt: context.now } } : {}),
        ...(input.customer
          ? {
              customer: {
                OR: [
                  { name: { contains: input.customer, mode: 'insensitive' as const } },
                  { companyName: { contains: input.customer, mode: 'insensitive' as const } },
                ],
              },
            }
          : {}),
        ...(input.from || input.to
          ? {
              issueDate: {
                ...(input.from ? { gte: new Date(input.from) } : {}),
                ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
      take: input.limit ?? 15,
      select: {
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        total: true,
        amountPaid: true,
        balanceDue: true,
        customer: { select: { name: true } },
      },
    });

    return toolData({
      invoices: rows.map((row) => ({
        number: row.number,
        customer: row.customer.name,
        status: row.status,
        issueDate: row.issueDate.toISOString().slice(0, 10),
        dueDate: row.dueDate.toISOString().slice(0, 10),
        total: toNumber(row.total),
        totalFormatted: money(row.total, context),
        paid: toNumber(row.amountPaid),
        owing: toNumber(row.balanceDue),
        owingFormatted: money(row.balanceDue, context),
      })),
    });
  },
});

export const getInvoice = defineTool({
  name: 'get_invoice',
  description: 'One invoice in full, with its lines and what has been paid against it.',
  permission: 'invoices.view',
  writes: false,
  schema: z.object({
    number: z.string().min(1).max(60).describe('The invoice number, e.g. INV-2026-00012'),
  }),
  async run(input, context) {
    const invoice = await db.invoice.findFirst({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        number: { equals: input.number, mode: 'insensitive' },
      },
      select: {
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        shippingAmount: true,
        total: true,
        amountPaid: true,
        balanceDue: true,
        reference: true,
        notes: true,
        customer: { select: { name: true, email: true } },
        items: {
          orderBy: { sortOrder: 'asc' },
          select: {
            name: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            taxRate: true,
            discountRate: true,
            lineTotal: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          select: { number: true, amount: true, method: true, paidAt: true },
        },
      },
    });

    if (!invoice) return toolError(`There is no invoice numbered ${input.number} here.`);

    return toolData({
      number: invoice.number,
      customer: invoice.customer.name,
      customerEmail: invoice.customer.email,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString().slice(0, 10),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      reference: invoice.reference,
      notes: invoice.notes,
      lines: invoice.items.map((item) => ({
        description: item.name,
        quantity: toNumber(item.quantity),
        unit: item.unit,
        unitPrice: toNumber(item.unitPrice),
        taxRate: toNumber(item.taxRate),
        discountRate: toNumber(item.discountRate),
        lineTotal: toNumber(item.lineTotal),
      })),
      subtotal: toNumber(invoice.subtotal),
      discount: toNumber(invoice.discountAmount),
      tax: toNumber(invoice.taxAmount),
      shipping: toNumber(invoice.shippingAmount),
      total: toNumber(invoice.total),
      totalFormatted: money(invoice.total, context),
      paid: toNumber(invoice.amountPaid),
      owing: toNumber(invoice.balanceDue),
      owingFormatted: money(invoice.balanceDue, context),
      payments: invoice.payments.map((payment) => ({
        number: payment.number,
        amount: toNumber(payment.amount),
        method: payment.method,
        paidAt: payment.paidAt.toISOString().slice(0, 10),
      })),
    });
  },
});

export const businessSummary = defineTool({
  name: 'business_summary',
  description:
    'How the business is doing: money owed, overdue, invoiced and received this month against last, and how many products are low on stock.',
  permission: 'dashboard.view',
  writes: false,
  schema: z.object({}),
  async run(_input, context) {
    const scope = { organizationId: context.organizationId, deletedAt: null };
    const thisMonth = startOfMonth(context.now);
    const lastMonth = startOfMonth(subMonths(context.now, 1));
    const endOfLast = endOfMonth(subMonths(context.now, 1));

    const [owed, overdue, invoicedThis, invoicedLast, receivedThis, lowStock, counts] =
      await Promise.all([
        db.invoice.aggregate({
          where: { ...scope, status: { notIn: ['DRAFT', 'CANCELLED'] }, balanceDue: { gt: 0 } },
          _sum: { balanceDue: true },
        }),
        db.invoice.aggregate({
          where: {
            ...scope,
            status: { notIn: ['DRAFT', 'CANCELLED'] },
            balanceDue: { gt: 0 },
            dueDate: { lt: context.now },
          },
          _sum: { balanceDue: true },
          _count: true,
        }),
        db.invoice.aggregate({
          where: { ...scope, status: { not: 'CANCELLED' }, issueDate: { gte: thisMonth } },
          _sum: { total: true },
          _count: true,
        }),
        db.invoice.aggregate({
          where: {
            ...scope,
            status: { not: 'CANCELLED' },
            issueDate: { gte: lastMonth, lte: endOfLast },
          },
          _sum: { total: true },
        }),
        db.payment.aggregate({
          where: {
            organizationId: context.organizationId,
            deletedAt: null,
            direction: 'INCOMING',
            paidAt: { gte: thisMonth },
          },
          _sum: { amount: true },
        }),
        db.product.count({
          where: {
            organizationId: context.organizationId,
            deletedAt: null,
            trackInventory: true,
            status: 'ACTIVE',
          },
        }),
        Promise.all([
          db.customer.count({ where: scope }),
          db.product.count({ where: scope }),
          db.employee.count({ where: { ...scope, status: { not: 'TERMINATED' } } }),
        ]),
      ]);

    const value = (raw: unknown) => {
      const amount = round(toNumber(raw as number));
      return { amount, formatted: money(amount, context) };
    };

    return toolData({
      currency: context.currency,
      today: context.now.toISOString().slice(0, 10),
      outstanding: value(owed._sum.balanceDue),
      overdue: { ...value(overdue._sum.balanceDue), invoices: overdue._count },
      invoicedThisMonth: { ...value(invoicedThis._sum.total), invoices: invoicedThis._count },
      invoicedLastMonth: value(invoicedLast._sum.total),
      receivedThisMonth: value(receivedThis._sum?.amount),
      trackedProducts: lowStock,
      customers: counts[0],
      products: counts[1],
      employees: counts[2],
    });
  },
});

export const searchEmployees = defineTool({
  name: 'search_employees',
  description:
    'Find staff by name, position or department, with their status, start date and salary.',
  permission: 'employees.view',
  writes: false,
  schema: z.object({
    query: z.string().max(80).optional(),
    status: z.enum(['ACTIVE', 'PROBATION', 'ON_LEAVE', 'TERMINATED']).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  async run(input, context) {
    const rows = await db.employee.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        ...(input.status ? { status: input.status } : {}),
        ...(input.query
          ? {
              OR: [
                { firstName: { contains: input.query, mode: 'insensitive' as const } },
                { lastName: { contains: input.query, mode: 'insensitive' as const } },
                { position: { contains: input.query, mode: 'insensitive' as const } },
                { department: { contains: input.query, mode: 'insensitive' as const } },
                { email: { contains: input.query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: input.limit ?? 20,
      select: {
        employeeNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        employmentType: true,
        status: true,
        hiredAt: true,
        baseSalary: true,
      },
    });

    return toolData({
      employees: rows.map((row) => ({
        reference: row.employeeNumber,
        name: `${row.firstName} ${row.lastName}`,
        email: row.email,
        phone: row.phone,
        position: row.position,
        department: row.department,
        employmentType: row.employmentType,
        status: row.status,
        startedOn: row.hiredAt.toISOString().slice(0, 10),
        baseSalary: toNumber(row.baseSalary),
        baseSalaryFormatted: money(row.baseSalary, context),
      })),
    });
  },
});

export const listAttendance = defineTool({
  name: 'list_attendance',
  description: 'Attendance days already recorded, optionally for one person or one date range.',
  permission: 'attendance.view',
  writes: false,
  schema: z.object({
    employee: z.string().max(80).optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    limit: z.number().int().min(1).max(60).optional(),
  }),
  async run(input, context) {
    let employeeId: string | undefined;
    if (input.employee) {
      const found = await resolveEmployee(input.employee, context);
      if (!found.ok) return toolError(found.message);
      employeeId = found.row.id;
    }

    const rows = await db.attendance.findMany({
      where: {
        organizationId: context.organizationId,
        ...(employeeId ? { employeeId } : {}),
        ...(input.from || input.to
          ? {
              date: {
                ...(input.from ? { gte: new Date(input.from) } : {}),
                ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: 'desc' }],
      take: input.limit ?? 30,
      select: {
        date: true,
        status: true,
        hoursWorked: true,
        checkIn: true,
        checkOut: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return toolData({
      attendance: rows.map((row) => ({
        employee: `${row.employee.firstName} ${row.employee.lastName}`,
        date: row.date.toISOString().slice(0, 10),
        status: row.status,
        hours: toNumber(row.hoursWorked),
        checkIn: row.checkIn,
        checkOut: row.checkOut,
      })),
    });
  },
});

export const listPayroll = defineTool({
  name: 'list_payroll',
  description: 'Payslips already raised, with their period, net pay and whether they are paid.',
  permission: 'payroll.view',
  writes: false,
  schema: z.object({
    employee: z.string().max(80).optional(),
    from: dateString.optional().describe('Period starting on or after'),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  async run(input, context) {
    let employeeId: string | undefined;
    if (input.employee) {
      const found = await resolveEmployee(input.employee, context);
      if (!found.ok) return toolError(found.message);
      employeeId = found.row.id;
    }

    const rows = await db.payroll.findMany({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        ...(employeeId ? { employeeId } : {}),
        ...(input.from ? { periodStart: { gte: new Date(input.from) } } : {}),
      },
      orderBy: [{ periodStart: 'desc' }],
      take: input.limit ?? 20,
      select: {
        number: true,
        periodStart: true,
        periodEnd: true,
        baseSalary: true,
        allowances: true,
        overtime: true,
        bonus: true,
        netSalary: true,
        status: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return toolData({
      payslips: rows.map((row) => ({
        number: row.number,
        employee: `${row.employee.firstName} ${row.employee.lastName}`,
        periodStart: row.periodStart.toISOString().slice(0, 10),
        periodEnd: row.periodEnd.toISOString().slice(0, 10),
        gross: round(
          toNumber(row.baseSalary) +
            toNumber(row.allowances) +
            toNumber(row.overtime) +
            toNumber(row.bonus),
        ),
        net: toNumber(row.netSalary),
        netFormatted: money(row.netSalary, context),
        status: row.status,
      })),
    });
  },
});

export const READ_TOOLS = [
  businessSummary,
  searchCustomers,
  searchProducts,
  listInvoices,
  getInvoice,
  searchEmployees,
  listAttendance,
  listPayroll,
];

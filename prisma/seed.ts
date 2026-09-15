import 'dotenv/config';

import { hash } from 'bcryptjs';
import { addDays, addMonths, startOfDay, subDays, subMonths } from 'date-fns';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import type { Prisma } from '../src/generated/prisma/client';
import { calculateDocumentTotals, round } from '../src/lib/money';
import { provisionOrganization } from '../src/server/services/provisioning';
import { nextDocumentNumber } from '../src/server/numbering';
import { slugify } from '../src/lib/utils';

import {
  CATEGORIES,
  CUSTOMERS,
  EMPLOYEES,
  EXPENSE_ROWS,
  PAYMENT_NOTES,
  PRODUCTS,
  PROJECTS,
  RECURRING_EXPENSES,
  SUPPLIERS,
  TASKS,
} from './seed-data';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Unchanged through the rename on purpose: the deployed database was already
// seeded with it, and rotating it here would only desynchronise the two.
const DEMO_PASSWORD = 'Flow360Demo!';
const now = new Date();

/**
 * The currency the demo workspaces keep their books in.
 *
 * Stamped on every document as well as on the organization: the columns
 * default to USD in the schema, and a workspace whose invoices claim a
 * currency it does not use is wrong in a way that only surfaces on export.
 */
const CURRENCY = 'GHS';

/** Deterministic pseudo-random so re-seeding produces the same demo numbers. */
let seedState = 20260912;
function random() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

async function main() {
  console.info('Resetting demo data…');
  await db.$transaction([
    db.activityLog.deleteMany(),
    db.notification.deleteMany(),
    db.timesheet.deleteMany(),
    db.task.deleteMany(),
    db.projectMember.deleteMany(),
    db.attendance.deleteMany(),
    db.payroll.deleteMany(),
    db.transaction.deleteMany(),
    db.payment.deleteMany(),
    db.billItem.deleteMany(),
    db.bill.deleteMany(),
    db.purchaseOrderItem.deleteMany(),
    db.purchaseOrder.deleteMany(),
    db.invoiceItem.deleteMany(),
    db.quotationItem.deleteMany(),
    db.invoice.deleteMany(),
    db.quotation.deleteMany(),
    db.expense.deleteMany(),
    db.project.deleteMany(),
    db.inventoryTransaction.deleteMany(),
    db.product.deleteMany(),
    db.productCategory.deleteMany(),
    db.expenseCategory.deleteMany(),
    db.employee.deleteMany(),
    db.customer.deleteMany(),
    db.supplier.deleteMany(),
    db.account.deleteMany(),
    db.taxRate.deleteMany(),
    db.numberSequence.deleteMany(),
    db.branch.deleteMany(),
    db.organizationMember.deleteMany(),
    db.rolePermission.deleteMany(),
    db.role.deleteMany(),
    db.companySettings.deleteMany(),
    db.organization.deleteMany(),
    db.verificationToken.deleteMany(),
    db.user.deleteMany(),
  ]);

  const passwordHash = await hash(DEMO_PASSWORD, 12);

  console.info('Creating users…');
  const owner = await db.user.create({
    data: {
      name: 'Alex Moreno',
      email: 'owner@northwindsupply.example',
      passwordHash,
      jobTitle: 'Managing Director',
      phone: '+1 (415) 555-0201',
      emailVerified: now,
    },
  });

  const teammates = await Promise.all(
    [
      { name: 'Nadia Osei', email: 'nadia@northwindsupply.example', role: 'manager', jobTitle: 'Head of Sales' },
      { name: 'Clara Nkemelu', email: 'clara@northwindsupply.example', role: 'accountant', jobTitle: 'Management Accountant' },
      { name: 'Sophie Lang', email: 'sophie@northwindsupply.example', role: 'sales', jobTitle: 'Interior Designer' },
      { name: 'Ben Ferraro', email: 'ben@northwindsupply.example', role: 'employee', jobTitle: 'Operations Manager' },
    ].map(async (person) => ({
      role: person.role,
      user: await db.user.create({
        data: {
          name: person.name,
          email: person.email,
          passwordHash,
          jobTitle: person.jobTitle,
          emailVerified: now,
        },
      }),
    })),
  );

  console.info('Provisioning organizations…');
  const { organizationId, roleIdByKey } = await db.$transaction((tx) =>
    provisionOrganization(tx, {
      name: 'Northwind Supply Co.',
      slug: slugify('Northwind Supply Co'),
      ownerUserId: owner.id,
      currency: CURRENCY,
      country: 'Ghana',
      email: 'accounts@northwindsupply.example',
    }),
  );

  await db.organizationMember.createMany({
    data: teammates.map((member) => ({
      organizationId,
      userId: member.user.id,
      roleId: roleIdByKey.get(member.role)!,
      status: 'ACTIVE' as const,
      joinedAt: subMonths(now, between(3, 30)),
    })),
  });

  await db.organization.update({
    where: { id: organizationId },
    data: {
      legalName: 'Northwind Supply Company LLC',
      phone: '+1 (415) 555-0200',
      website: 'https://northwindsupply.example',
      taxId: 'US-884-120-663',
      addressLine1: '1400 Cesar Chavez Street',
      addressLine2: 'Unit 22',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      industry: 'Commercial interiors',
      plan: 'business',
      // Mid-trial, so the demo shows the ordinary countdown rather than a
      // freshly provisioned workspace with a full month still to run.
      subscriptionStatus: 'trialing',
      trialEndsAt: addDays(now, 18),
    },
  });

  // A second tenant proves isolation: nothing below is visible from Northwind.
  const secondUser = await db.user.create({
    data: {
      name: 'Rosa Iglesias',
      email: 'rosa@harbourfitouts.example',
      passwordHash,
      jobTitle: 'Founder',
      emailVerified: now,
    },
  });
  const second = await db.$transaction((tx) =>
    provisionOrganization(tx, {
      name: 'Harbour Fitouts Ltd.',
      slug: 'harbour-fitouts',
      ownerUserId: secondUser.id,
      currency: CURRENCY,
      country: 'Ghana',
      email: 'hello@harbourfitouts.example',
    }),
  );
  // The second tenant is near the end of its trial, so the warning banner and
  // the "ending soon" sidebar card are both reachable from demo data.
  await db.organization.update({
    where: { id: second.organizationId },
    data: { subscriptionStatus: 'trialing', trialEndsAt: addDays(now, 4) },
  });

  await db.customer.create({
    data: {
      organizationId: second.organizationId,
      name: 'Bay Marina Offices',
      companyName: 'Bay Marina Offices LLC',
      email: 'admin@baymarina.example',
      city: 'Sausalito',
      country: 'United States',
    },
  });

  console.info('Creating catalogue…');
  const categoryIdByName = new Map<string, string>();
  for (const category of CATEGORIES) {
    const created = await db.productCategory.create({
      data: { organizationId, name: category.name, description: category.description },
    });
    categoryIdByName.set(category.name, created.id);
  }

  const supplierIdByName = new Map<string, string>();
  for (const supplier of SUPPLIERS) {
    const created = await db.supplier.create({ data: { organizationId, ...supplier } });
    supplierIdByName.set(supplier.name, created.id);
  }

  const products = [];
  for (const product of PRODUCTS) {
    const created = await db.product.create({
      data: {
        organizationId,
        name: product.name,
        sku: product.sku,
        description: product.description,
        type: product.type ?? 'GOOD',
        unit: product.unit,
        categoryId: categoryIdByName.get(product.category) ?? null,
        supplierId: product.supplier ? (supplierIdByName.get(product.supplier) ?? null) : null,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        taxRate: 10,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        trackInventory: (product.type ?? 'GOOD') === 'GOOD',
      },
    });
    products.push({
      ...created,
      sellingPriceNumber: product.sellingPrice,
      remaining: product.stockQuantity,
    });

    if ((product.type ?? 'GOOD') === 'GOOD' && product.stockQuantity > 0) {
      await db.inventoryTransaction.create({
        data: {
          organizationId,
          productId: created.id,
          type: 'STOCK_IN',
          quantity: product.stockQuantity,
          balanceAfter: product.stockQuantity,
          unitCost: product.purchasePrice,
          reason: 'Opening stock balance',
          occurredAt: subMonths(now, 8),
        },
      });
    }
  }

  console.info('Creating customers…');
  const customers = [];
  for (const customer of CUSTOMERS) {
    customers.push(
      await db.customer.create({
        data: {
          organizationId,
          ...customer,
          country: 'United States',
          createdAt: subMonths(now, between(1, 26)),
        },
      }),
    );
  }

  console.info('Creating employees…');
  const employees = [];
  for (const [index, employee] of EMPLOYEES.entries()) {
    employees.push(
      await db.employee.create({
        data: {
          organizationId,
          currency: CURRENCY,
          employeeNumber: `EMP-${String(index + 1).padStart(4, '0')}`,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          position: employee.position,
          baseSalary: employee.baseSalary,
          hiredAt: subMonths(now, employee.hiredMonthsAgo),
          city: 'San Francisco',
          country: 'United States',
        },
      }),
    );
  }

  const accounts = await db.account.findMany({ where: { organizationId } });
  const bankAccount = accounts.find((account) => account.type === 'BANK')!;
  const cashAccount = accounts.find((account) => account.type === 'CASH')!;

  console.info('Creating quotations…');
  const sellableProducts = products.filter((product) => product.type === 'GOOD');
  const serviceProducts = products.filter((product) => product.type === 'SERVICE');

  const quotationStatuses = [
    'ACCEPTED',
    'SENT',
    'DRAFT',
    'REJECTED',
    'SENT',
    'EXPIRED',
    'ACCEPTED',
    'SENT',
  ] as const;

  const quotations = [];
  for (const [index, status] of quotationStatuses.entries()) {
    const customer = customers[index % customers.length];
    const issueDate = subDays(now, between(5, 90));
    // Quotations are not commitments, so they draw from a copy that leaves the
    // real remaining-stock ledger untouched.
    const lines = buildLines(
      sellableProducts.map((product) => ({ ...product })),
      serviceProducts,
    );
    const totals = calculateDocumentTotals({
      lines: lines.map((line) => ({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountRate: line.discountRate,
        taxRate: line.taxRate,
      })),
      discountType: 'PERCENTAGE',
      discountValue: index % 3 === 0 ? 5 : 0,
    });

    const quotation = await db.quotation.create({
      data: {
        organizationId,
        currency: CURRENCY,
        customerId: customer.id,
        number: await nextDocumentNumber(db, organizationId, 'quotation', {
          date: issueDate,
        }),
        status,
        issueDate,
        expiryDate: addDays(issueDate, 30),
        subtotal: totals.subtotal,
        discountType: 'PERCENTAGE',
        discountValue: index % 3 === 0 ? 5 : 0,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes:
          'Lead time is 3–4 weeks from order. Installation is quoted for a single weekend visit.',
        terms: 'Valid for 30 days. 50% deposit on order, balance on completion.',
        sentAt: status === 'DRAFT' ? null : addDays(issueDate, 1),
        acceptedAt: status === 'ACCEPTED' ? addDays(issueDate, between(2, 9)) : null,
        rejectedAt: status === 'REJECTED' ? addDays(issueDate, 6) : null,
        createdById: owner.id,
        createdAt: issueDate,
        items: {
          create: lines.map((line, order) => ({
            productId: line.productId,
            name: line.name,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discountRate: line.discountRate,
            taxRate: line.taxRate,
            lineSubtotal: totals.lines[order].lineSubtotal,
            lineDiscount: totals.lines[order].lineDiscount,
            lineTax: totals.lines[order].lineTax,
            lineTotal: totals.lines[order].lineTotal,
            sortOrder: order,
          })),
        },
      },
    });
    quotations.push(quotation);
  }

  console.info('Creating invoices, payments and ledger entries…');
  // The live pipeline: one invoice in each status, all inside the last ~5 weeks
  // so the current-period dashboard shows every state at once.
  const invoicePlan: Array<{
    status: 'PAID' | 'PARTIALLY_PAID' | 'SENT' | 'VIEWED' | 'OVERDUE' | 'DRAFT' | 'CANCELLED';
    daysAgo: number;
    termDays: number;
  }> = [
    { status: 'PAID', daysAgo: 34, termDays: 30 },
    { status: 'PAID', daysAgo: 28, termDays: 14 },
    { status: 'OVERDUE', daysAgo: 26, termDays: 14 },
    { status: 'PAID', daysAgo: 22, termDays: 30 },
    { status: 'PARTIALLY_PAID', daysAgo: 18, termDays: 30 },
    { status: 'PAID', daysAgo: 15, termDays: 14 },
    { status: 'CANCELLED', daysAgo: 12, termDays: 30 },
    { status: 'VIEWED', daysAgo: 9, termDays: 30 },
    { status: 'PAID', daysAgo: 6, termDays: 14 },
    { status: 'SENT', daysAgo: 4, termDays: 21 },
    { status: 'DRAFT', daysAgo: 2, termDays: 14 },
  ];

  /**
   * Trading history for the five months before the current one. These are all
   * settled, so the dashboard's trend, top-product and profit figures have a
   * believable baseline instead of a single spike.
   */
  const historyPlan: Array<{ status: 'PAID'; daysAgo: number; termDays: number }> = [];
  for (let monthsBack = 5; monthsBack >= 1; monthsBack -= 1) {
    const invoicesThatMonth = between(3, 5);
    for (let n = 0; n < invoicesThatMonth; n += 1) {
      historyPlan.push({
        status: 'PAID',
        daysAgo: monthsBack * 30 + between(0, 27),
        termDays: pick([14, 30] as const),
      });
    }
  }

  // Re-date the pipeline so it sits inside the current month however far into
  // the month the seed happens to run; below ten days elapsed it reaches back a
  // little further rather than stacking every invoice on the same date.
  const daysElapsed = now.getDate() - 1;
  const window = daysElapsed >= 10 ? daysElapsed : 20;
  const pipeline = invoicePlan.map((plan, index) => ({
    ...plan,
    daysAgo: Math.round((index / Math.max(1, invoicePlan.length - 1)) * window),
  }));

  const allInvoices = [...historyPlan, ...pipeline].sort(
    (a, b) => b.daysAgo - a.daysAgo,
  );

  let paymentSeq = 0;
  for (const [index, plan] of allInvoices.entries()) {
    const customer = customers[index % customers.length];
    const issueDate = startOfDay(subDays(now, plan.daysAgo));
    const dueDate = addDays(issueDate, plan.termDays);
    const lines = buildLines(sellableProducts, serviceProducts);
    const discountValue = index % 4 === 0 ? 3 : 0;

    const totals = calculateDocumentTotals({
      lines: lines.map((line) => ({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountRate: line.discountRate,
        taxRate: line.taxRate,
      })),
      discountType: 'PERCENTAGE',
      discountValue,
    });

    const amountPaid =
      plan.status === 'PAID'
        ? totals.total
        : plan.status === 'PARTIALLY_PAID'
          ? round(totals.total * 0.4)
          : 0;

    const invoice = await db.invoice.create({
      data: {
        organizationId,
        currency: CURRENCY,
        customerId: customer.id,
        number: await nextDocumentNumber(db, organizationId, 'invoice', {
          date: issueDate,
        }),
        status: plan.status,
        issueDate,
        dueDate,
        subtotal: totals.subtotal,
        discountType: 'PERCENTAGE',
        discountValue,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        amountPaid,
        balanceDue: round(totals.total - amountPaid),
        notes: 'Thank you for your order. Please quote the invoice number with payment.',
        terms: `Payment due within ${plan.termDays} days of the invoice date.`,
        sentAt: plan.status === 'DRAFT' ? null : addDays(issueDate, 1),
        viewedAt: ['VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].includes(plan.status)
          ? addDays(issueDate, 2)
          : null,
        paidAt: plan.status === 'PAID' ? addDays(issueDate, between(3, plan.termDays)) : null,
        cancelledAt: plan.status === 'CANCELLED' ? addDays(issueDate, 4) : null,
        createdById: owner.id,
        createdAt: issueDate,
        items: {
          create: lines.map((line, order) => ({
            productId: line.productId,
            name: line.name,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discountRate: line.discountRate,
            taxRate: line.taxRate,
            lineSubtotal: totals.lines[order].lineSubtotal,
            lineDiscount: totals.lines[order].lineDiscount,
            lineTax: totals.lines[order].lineTax,
            lineTotal: totals.lines[order].lineTotal,
            sortOrder: order,
          })),
        },
      },
    });

    // Stock leaves the building when a real (non-draft, non-cancelled) invoice ships.
    if (!['DRAFT', 'CANCELLED'].includes(plan.status)) {
      for (const line of lines) {
        if (!line.productId || !line.tracked) continue;
        await db.product.update({
          where: { id: line.productId },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        const current = await db.product.findUnique({
          where: { id: line.productId },
          select: { stockQuantity: true },
        });
        await db.inventoryTransaction.create({
          data: {
            organizationId,
            productId: line.productId,
            type: 'SALE',
            quantity: -line.quantity,
            balanceAfter: current?.stockQuantity ?? 0,
            reference: invoice.number,
            referenceType: 'invoice',
            referenceId: invoice.id,
            reason: `Sold on ${invoice.number}`,
            occurredAt: issueDate,
          },
        });
      }
    }

    if (amountPaid > 0) {
      paymentSeq += 1;
      const paidAt = addDays(issueDate, between(3, plan.termDays));
      const payment = await db.payment.create({
        data: {
          organizationId,
          currency: CURRENCY,
          number: await nextDocumentNumber(db, organizationId, 'payment', {
            date: paidAt,
          }),
          direction: 'INCOMING',
          method: pick(['BANK_TRANSFER', 'CARD', 'BANK_TRANSFER', 'CHECK'] as const),
          amount: amountPaid,
          paidAt,
          reference: `${invoice.number}/REM`,
          notes: pick(PAYMENT_NOTES),
          customerId: customer.id,
          invoiceId: invoice.id,
          accountId: bankAccount.id,
          createdById: owner.id,
        },
      });

      await db.transaction.create({
        data: {
          organizationId,
          currency: CURRENCY,
          accountId: bankAccount.id,
          type: 'INCOME',
          amount: amountPaid,
          description: `Payment received for ${invoice.number}`,
          category: 'Sales',
          occurredAt: paidAt,
          reference: payment.number,
          invoiceId: invoice.id,
          paymentId: payment.id,
          customerId: customer.id,
        },
      });

      await db.account.update({
        where: { id: bankAccount.id },
        data: { currentBalance: { increment: amountPaid } },
      });
    }
  }

  console.info('Creating expenses…');
  const expenseCategories = await db.expenseCategory.findMany({ where: { organizationId } });
  const categoryByName = new Map(expenseCategories.map((row) => [row.name, row.id]));

  // One-off costs, plus the recurring monthly baseline for each of the last
  // six months, so spend is a steady line rather than a single cluster.
  const expenseRows: Array<{
    title: string;
    category: string;
    amount: number;
    vendorName: string;
    method: string;
    daysAgo: number;
  }> = [
    ...EXPENSE_ROWS,
    ...Array.from({ length: 6 }).flatMap((_, monthsBack) =>
      RECURRING_EXPENSES.map((expense) => ({
        ...expense,
        title: `${expense.title}, ${monthsBack === 0 ? 'current month' : `${monthsBack} month${monthsBack === 1 ? '' : 's'} ago`}`,
        daysAgo: monthsBack * 30 + between(1, 20),
      })),
    ),
  ];

  for (const [index, expense] of expenseRows.entries()) {
    const spentAt = startOfDay(subDays(now, expense.daysAgo));
    const taxAmount = round(expense.amount * 0.1);
    const account = expense.method === 'CARD' ? cashAccount : bankAccount;

    const created = await db.expense.create({
      data: {
        organizationId,
        currency: CURRENCY,
        number: await nextDocumentNumber(db, organizationId, 'expense', {
          date: spentAt,
        }),
        categoryId: categoryByName.get(expense.category) ?? null,
        accountId: account.id,
        title: expense.title,
        description: `${expense.title}, recorded from supplier documentation.`,
        amount: expense.amount,
        taxAmount,
        total: round(expense.amount + taxAmount),
        method: expense.method as Prisma.ExpenseCreateInput['method'],
        status: 'APPROVED',
        spentAt,
        vendorName: expense.vendorName,
        createdById: owner.id,
        createdAt: spentAt,
      },
    });

    await db.transaction.create({
      data: {
        organizationId,
        currency: CURRENCY,
        accountId: account.id,
        type: 'EXPENSE',
        amount: -round(expense.amount + taxAmount),
        description: expense.title,
        category: expense.category,
        occurredAt: spentAt,
        reference: created.number,
        expenseId: created.id,
      },
    });

    await db.account.update({
      where: { id: account.id },
      data: { currentBalance: { decrement: round(expense.amount + taxAmount) } },
    });
  }

  console.info('Creating projects, tasks and payroll…');
  const projectIdByCode = new Map<string, string>();
  for (const project of PROJECTS) {
    const customer = customers.find(
      (row) => row.companyName === project.customer,
    );
    const created = await db.project.create({
      data: {
        organizationId,
        currency: CURRENCY,
        customerId: customer?.id ?? null,
        code: project.code,
        name: project.name,
        description: project.description,
        status: project.status as Prisma.ProjectCreateInput['status'],
        startDate: subMonths(now, project.startMonthsAgo),
        endDate: addMonths(now, project.endMonthsAhead),
        budget: project.budget,
        spent: round(project.budget * (project.progress / 100) * 0.82),
        progress: project.progress,
        members: {
          create: employees.slice(0, 3).map((employee, index) => ({
            employeeId: employee.id,
            role: index === 0 ? 'Project lead' : 'Contributor',
            hourlyRate: index === 0 ? 95 : 72,
          })),
        },
      },
    });
    projectIdByCode.set(project.code, created.id);
  }

  const assignees = [owner, ...teammates.map((member) => member.user)];
  for (const [index, task] of TASKS.entries()) {
    await db.task.create({
      data: {
        organizationId,
        projectId: task.project ? (projectIdByCode.get(task.project) ?? null) : null,
        title: task.title,
        description: null,
        status: task.status as Prisma.TaskCreateInput['status'],
        priority: task.priority as Prisma.TaskCreateInput['priority'],
        assigneeId: assignees[index % assignees.length].id,
        dueDate: addDays(now, task.dueInDays),
        completedAt: task.status === 'DONE' ? addDays(now, task.dueInDays) : null,
        estimatedHours: task.hours,
        sortOrder: index,
      },
    });
  }

  for (const [projectCode, projectId] of projectIdByCode) {
    for (let week = 1; week <= 4; week += 1) {
      await db.timesheet.create({
        data: {
          organizationId,
          projectId,
          employeeId: employees[week % employees.length].id,
          date: subDays(now, week * 7),
          hours: between(4, 9),
          description: `Site coordination and supplier follow-up (${projectCode})`,
          billable: true,
          hourlyRate: 88,
        },
      });
    }
  }

  const periodStart = startOfDay(subMonths(now, 1));
  const periodEnd = subDays(startOfDay(now), 1);
  for (const [index, employee] of employees.entries()) {
    const base = Number(employee.baseSalary);
    const allowances = round(base * 0.08);
    const taxDeduction = round(base * 0.19);
    const otherDeduction = round(base * 0.04);
    await db.payroll.create({
      data: {
        organizationId,
        currency: CURRENCY,
        employeeId: employee.id,
        number: await nextDocumentNumber(db, organizationId, 'payroll', {
          date: periodEnd,
        }),
        periodStart,
        periodEnd,
        baseSalary: base,
        allowances,
        bonus: index === 0 ? 900 : 0,
        taxDeduction,
        otherDeduction,
        netSalary: round(
          base + allowances + (index === 0 ? 900 : 0) - taxDeduction - otherDeduction,
        ),
        status: 'PAID',
        paidAt: periodEnd,
      },
    });
  }

  for (const employee of employees) {
    for (let day = 1; day <= 10; day += 1) {
      const date = subDays(startOfDay(now), day);
      if ([0, 6].includes(date.getDay())) continue;
      await db.attendance.create({
        data: {
          organizationId,
          employeeId: employee.id,
          date,
          status: day === 4 ? 'LATE' : 'PRESENT',
          hoursWorked: day === 4 ? 7 : 8,
        },
      });
    }
  }

  console.info('Creating notifications…');
  const overdue = await db.invoice.findFirst({
    where: { organizationId, status: 'OVERDUE' },
    select: { id: true, number: true, customer: { select: { name: true } } },
  });

  await db.notification.createMany({
    data: [
      overdue
        ? {
            organizationId,
            type: 'INVOICE_OVERDUE' as const,
            title: `${overdue.number} is past due`,
            body: `${overdue.customer.name} has not settled this invoice. Consider sending a reminder.`,
            href: `/invoices/${overdue.id}`,
          }
        : null,
      {
        organizationId,
        type: 'LOW_STOCK' as const,
        title: 'Three products are below their reorder point',
        body: 'Draughtsman Stool, Corner Workstation 1800 and Acoustic Ceiling Baffle need restocking.',
        href: '/inventory',
      },
      {
        organizationId,
        type: 'PAYMENT_RECEIVED' as const,
        title: 'Payment received',
        body: 'A bank transfer has been matched to an open invoice.',
        href: '/payments',
        readAt: subDays(now, 1),
      },
    ].filter(Boolean) as Prisma.NotificationCreateManyInput[],
  });

  const counts = {
    customers: await db.customer.count({ where: { organizationId } }),
    products: await db.product.count({ where: { organizationId } }),
    invoices: await db.invoice.count({ where: { organizationId } }),
    quotations: await db.quotation.count({ where: { organizationId } }),
    expenses: await db.expense.count({ where: { organizationId } }),
    payments: await db.payment.count({ where: { organizationId } }),
    employees: await db.employee.count({ where: { organizationId } }),
    projects: await db.project.count({ where: { organizationId } }),
    tasks: await db.task.count({ where: { organizationId } }),
  };

  console.info('\nSeed complete.');
  console.table(counts);
  console.info(`\nSign in with:  owner@northwindsupply.example  /  ${DEMO_PASSWORD}`);
  console.info(`Other roles:   nadia@ (manager), clara@ (accountant), sophie@ (sales), ben@ (employee)`);
  console.info(`Second tenant: rosa@harbourfitouts.example  /  ${DEMO_PASSWORD}\n`);
}

type BuiltLine = {
  productId: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  tracked: boolean;
};

/** Builds a plausible mix of two to four goods plus an install line. */
type SellableProduct = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  sellingPriceNumber: number;
  trackInventory: boolean;
  /** Running stock left as the seed walks forward through documents. */
  remaining: number;
};

function buildLines(
  goods: SellableProduct[],
  services: SellableProduct[],
): BuiltLine[] {
  const chosen = new Set<number>();
  const count = between(2, 4);
  while (chosen.size < count) chosen.add(Math.floor(random() * goods.length));

  const lines: BuiltLine[] = [];
  for (const index of chosen) {
    const product = goods[index];
    // Never sell more than the demo warehouse holds, so stock stays >= 0 and a
    // few lines still fall through their reorder point naturally.
    const available = product.trackInventory ? Math.max(0, product.remaining) : Infinity;
    const quantity = Math.min(between(2, 14), available);
    if (quantity <= 0) continue;
    if (product.trackInventory) product.remaining -= quantity;

    lines.push({
      productId: product.id,
      name: product.name,
      description: product.description,
      quantity,
      unit: product.unit,
      unitPrice: product.sellingPriceNumber,
      discountRate: random() > 0.75 ? 5 : 0,
      taxRate: 10,
      tracked: product.trackInventory,
    });
  }

  const service = services[Math.floor(random() * services.length)];
  if (service) {
    lines.push({
      productId: service.id,
      name: service.name,
      description: service.description,
      quantity: between(4, 16),
      unit: service.unit,
      unitPrice: service.sellingPriceNumber,
      discountRate: 0,
      taxRate: 10,
      tracked: false,
    });
  }

  return lines;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

import 'server-only';

import { db } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';

/**
 * Changing the currency a workspace keeps its books in.
 *
 * Two different things get called "changing the currency", and conflating them
 * loses money:
 *
 *  - **relabel** — the figures were always in the new currency and the label
 *    was simply wrong. No arithmetic; only the label moves.
 *  - **convert** — the figures really were in the old currency, and every one
 *    of them is restated at a rate the owner supplies.
 *
 * A conversion is a restatement of your own books. It does not change what was
 * agreed with anybody: an invoice raised for 1,000 dollars was for 1,000
 * dollars, whatever your ledger now calls it. The rate and the date are written
 * to the activity log so the restatement can be traced, and the whole thing
 * runs in one database transaction so a workspace can never be left half
 * converted.
 */

export type CurrencyChangeMode = 'relabel' | 'convert';

/**
 * Columns holding an amount of money, which scale with the rate.
 *
 * Deliberately not an "everything of type Decimal" sweep: quantities, hours,
 * tax rates and discount percentages are Decimal too, and multiplying a 10%
 * tax rate by an exchange rate would be a mistake that balances perfectly and
 * is wrong everywhere.
 */
const MONEY_COLUMNS: Array<{ table: string; columns: string[] }> = [
  { table: 'customers', columns: ['creditLimit'] },
  { table: 'products', columns: ['purchasePrice', 'sellingPrice'] },
  { table: 'inventory_transactions', columns: ['unitCost'] },
  {
    table: 'invoices',
    columns: [
      'discountAmount',
      'taxAmount',
      'shippingAmount',
      'amountPaid',
    ],
  },
  { table: 'quotations', columns: ['discountAmount', 'taxAmount'] },
  { table: 'purchase_orders', columns: ['taxAmount', 'discountAmount'] },
  { table: 'bills', columns: ['taxAmount', 'amountPaid'] },
  { table: 'payments', columns: ['amount'] },
  { table: 'expenses', columns: ['amount', 'taxAmount'] },
  { table: 'accounts', columns: ['openingBalance', 'currentBalance'] },
  { table: 'transactions', columns: ['amount'] },
  { table: 'employees', columns: ['baseSalary'] },
  {
    table: 'payrolls',
    columns: [
      'baseSalary',
      'allowances',
      'overtime',
      'bonus',
      'taxDeduction',
      'otherDeduction',
    ],
  },
  { table: 'projects', columns: ['budget', 'spent'] },
];

/**
 * Line tables, reached through their parent document rather than a tenant id.
 *
 * Document headers are deliberately absent from the list above: their
 * subtotals and totals are rebuilt from these lines afterwards rather than
 * scaled alongside them.
 */
const LINE_TABLES: Array<{
  table: string;
  parent: string;
  key: string;
  columns: string[];
}> = [
  {
    table: 'invoice_items',
    parent: 'invoices',
    key: 'invoiceId',
    columns: ['unitPrice', 'lineSubtotal', 'lineDiscount', 'lineTax', 'lineTotal'],
  },
  {
    table: 'quotation_items',
    parent: 'quotations',
    key: 'quotationId',
    columns: ['unitPrice', 'lineSubtotal', 'lineDiscount', 'lineTax', 'lineTotal'],
  },
  {
    table: 'purchase_order_items',
    parent: 'purchase_orders',
    key: 'purchaseOrderId',
    columns: ['unitPrice', 'lineSubtotal', 'lineTax', 'lineTotal'],
  },
  {
    table: 'bill_items',
    parent: 'bills',
    key: 'billId',
    columns: ['unitPrice', 'lineSubtotal', 'lineTax', 'lineTotal'],
  },
  {
    table: 'project_members',
    parent: 'projects',
    key: 'projectId',
    columns: ['hourlyRate'],
  },
  {
    table: 'timesheets',
    parent: 'projects',
    key: 'projectId',
    columns: ['hourlyRate'],
  },
];

/** Tables carrying a currency label of their own. */
const LABELLED_TABLES = [
  'customers',
  'invoices',
  'quotations',
  'payments',
  'purchase_orders',
  'bills',
  'expenses',
  'accounts',
  'transactions',
  'employees',
  'payrolls',
  'projects',
];

function scaleColumn(
  table: string,
  column: string,
  rate: number,
  organizationId: string,
) {
  return Prisma.sql`
    UPDATE ${Prisma.raw(`"${table}"`)}
       SET ${Prisma.raw(`"${column}"`)} = ROUND(${Prisma.raw(`"${column}"`)} * ${rate}::numeric, 2)
     WHERE "organizationId" = ${organizationId}
       AND ${Prisma.raw(`"${column}"`)} IS NOT NULL`;
}

function scaleLineColumn(
  table: string,
  parent: string,
  key: string,
  column: string,
  rate: number,
  organizationId: string,
) {
  return Prisma.sql`
    UPDATE ${Prisma.raw(`"${table}"`)} AS line
       SET ${Prisma.raw(`"${column}"`)} = ROUND(line.${Prisma.raw(`"${column}"`)} * ${rate}::numeric, 2)
      FROM ${Prisma.raw(`"${parent}"`)} AS parent
     WHERE parent.id = line.${Prisma.raw(`"${key}"`)}
       AND parent."organizationId" = ${organizationId}
       AND line.${Prisma.raw(`"${column}"`)} IS NOT NULL`;
}

export type CurrencyChangeResult = {
  mode: CurrencyChangeMode;
  from: string;
  to: string;
  rate: number;
};

export async function changeOrganizationCurrency(
  organizationId: string,
  input: { to: string; mode: CurrencyChangeMode; rate: number },
): Promise<CurrencyChangeResult> {
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { currency: true },
  });

  const from = organization.currency;
  const rate = input.mode === 'convert' ? input.rate : 1;

  await db.$transaction(
    async (tx) => {
      if (input.mode === 'convert') {
        for (const { table, columns } of MONEY_COLUMNS) {
          for (const column of columns) {
            await tx.$executeRaw(scaleColumn(table, column, rate, organizationId));
          }
        }

        for (const { table, parent, key, columns } of LINE_TABLES) {
          for (const column of columns) {
            await tx.$executeRaw(
              scaleLineColumn(table, parent, key, column, rate, organizationId),
            );
          }
        }

        // A fixed document discount is an amount and scales; a percentage one
        // is not money at all and must be left exactly where it is.
        for (const table of ['invoices', 'quotations']) {
          await tx.$executeRaw(Prisma.sql`
            UPDATE ${Prisma.raw(`"${table}"`)}
               SET "discountValue" = ROUND("discountValue" * ${rate}::numeric, 2)
             WHERE "organizationId" = ${organizationId}
               AND "discountType" = 'FIXED'`);
        }

        await restateDocuments(tx, organizationId, rate);
      }

      for (const table of LABELLED_TABLES) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE ${Prisma.raw(`"${table}"`)}
             SET currency = ${input.to}
           WHERE "organizationId" = ${organizationId}`);
      }

      await tx.organization.update({
        where: { id: organizationId },
        data: { currency: input.to },
      });
    },
    // A workspace with years of history is a lot of rows, and leaving it half
    // converted would be far worse than making someone wait.
    { timeout: 120_000, maxWait: 20_000 },
  );

  return { mode: input.mode, from, to: input.to, rate };
}

/**
 * Puts each document's own arithmetic back together.
 *
 * Scaling is exactly linear, so every figure is right to the cent on its own —
 * but rounding each one independently lets a total drift a penny or two from
 * the lines above it, and a document whose lines do not add up to its total is
 * the kind of thing people stop trusting. Headers are therefore rebuilt from
 * the rounded lines rather than scaled beside them.
 */
async function restateDocuments(
  tx: Prisma.TransactionClient,
  organizationId: string,
  rate: number,
) {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "invoices" AS doc
       SET subtotal = totals.sub,
           total = ROUND(totals.sub - totals.line_discount - doc."discountAmount"
                         + doc."taxAmount" + doc."shippingAmount", 2),
           "balanceDue" = ROUND(totals.sub - totals.line_discount - doc."discountAmount"
                                + doc."taxAmount" + doc."shippingAmount"
                                - doc."amountPaid", 2)
      FROM (
        SELECT "invoiceId" AS id,
               SUM("lineSubtotal") AS sub,
               SUM("lineDiscount") AS line_discount
          FROM "invoice_items"
         GROUP BY "invoiceId"
      ) AS totals
     WHERE doc.id = totals.id
       AND doc."organizationId" = ${organizationId}`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "quotations" AS doc
       SET subtotal = totals.sub,
           total = ROUND(totals.sub - totals.line_discount - doc."discountAmount"
                         + doc."taxAmount", 2)
      FROM (
        SELECT "quotationId" AS id,
               SUM("lineSubtotal") AS sub,
               SUM("lineDiscount") AS line_discount
          FROM "quotation_items"
         GROUP BY "quotationId"
      ) AS totals
     WHERE doc.id = totals.id
       AND doc."organizationId" = ${organizationId}`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "purchase_orders" AS doc
       SET subtotal = totals.sub,
           total = ROUND(totals.sub - doc."discountAmount" + doc."taxAmount", 2)
      FROM (
        SELECT "purchaseOrderId" AS id, SUM("lineSubtotal") AS sub
          FROM "purchase_order_items"
         GROUP BY "purchaseOrderId"
      ) AS totals
     WHERE doc.id = totals.id
       AND doc."organizationId" = ${organizationId}`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "bills" AS doc
       SET subtotal = totals.sub,
           total = ROUND(totals.sub + doc."taxAmount", 2),
           "balanceDue" = ROUND(totals.sub + doc."taxAmount" - doc."amountPaid", 2)
      FROM (
        SELECT "billId" AS id, SUM("lineSubtotal") AS sub
          FROM "bill_items"
         GROUP BY "billId"
      ) AS totals
     WHERE doc.id = totals.id
       AND doc."organizationId" = ${organizationId}`);

  // A document with no lines at all would be skipped by the joins above, so
  // its header still needs scaling on its own terms.
  await tx.$executeRaw(Prisma.sql`
    UPDATE "invoices" AS doc
       SET subtotal = ROUND(subtotal * ${rate}::numeric, 2),
           total = ROUND(total * ${rate}::numeric, 2),
           "balanceDue" = ROUND("balanceDue" * ${rate}::numeric, 2)
     WHERE doc."organizationId" = ${organizationId}
       AND NOT EXISTS (SELECT 1 FROM "invoice_items" i WHERE i."invoiceId" = doc.id)`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "quotations" AS doc
       SET subtotal = ROUND(subtotal * ${rate}::numeric, 2),
           total = ROUND(total * ${rate}::numeric, 2)
     WHERE doc."organizationId" = ${organizationId}
       AND NOT EXISTS (SELECT 1 FROM "quotation_items" q WHERE q."quotationId" = doc.id)`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "purchase_orders" AS doc
       SET subtotal = ROUND(subtotal * ${rate}::numeric, 2),
           total = ROUND(total * ${rate}::numeric, 2)
     WHERE doc."organizationId" = ${organizationId}
       AND NOT EXISTS (
         SELECT 1 FROM "purchase_order_items" p WHERE p."purchaseOrderId" = doc.id
       )`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "bills" AS doc
       SET subtotal = ROUND(subtotal * ${rate}::numeric, 2),
           total = ROUND(total * ${rate}::numeric, 2),
           "balanceDue" = ROUND("balanceDue" * ${rate}::numeric, 2)
     WHERE doc."organizationId" = ${organizationId}
       AND NOT EXISTS (SELECT 1 FROM "bill_items" b WHERE b."billId" = doc.id)`);

  // Expenses and payslips have no lines; their own parts must still agree.
  await tx.$executeRaw(Prisma.sql`
    UPDATE "expenses"
       SET total = ROUND(amount + "taxAmount", 2)
     WHERE "organizationId" = ${organizationId}`);

  await tx.$executeRaw(Prisma.sql`
    UPDATE "payrolls"
       SET "netSalary" = ROUND("baseSalary" + allowances + overtime + bonus
                               - "taxDeduction" - "otherDeduction", 2)
     WHERE "organizationId" = ${organizationId}`);
}

import 'server-only';

import { addDays } from 'date-fns';

import { db } from '@/lib/db';
import { detectDelimiter, parseCsv } from '@/lib/csv';
import {
  findDataset,
  type ImportDataset,
  type ImportDatasetKey,
} from '@/lib/import/datasets';
import {
  autoMap,
  readRecords,
  unmappedColumns,
  type ColumnMap,
  type ReadRecord,
  type RowIssue,
} from '@/lib/import/mapping';
import { calculateDocumentTotals, round } from '@/lib/money';
import type { Prisma } from '@/generated/prisma/client';
import type { InvoiceStatus, PartyStatus, ProductType } from '@/generated/prisma/enums';

/**
 * Loading a business's existing records into their new workspace.
 *
 * The shape of the whole thing: read the file, plan every row without touching
 * the database, show the plan, and only then write. A migration is the most
 * nerve-racking thing anybody does with new software, and the worst version of
 * it is one that writes half a file and stops. So nothing here writes until
 * every row has been read and judged, and what could not be judged comes back
 * with a row number the person can find in their own spreadsheet.
 *
 * Two kinds of thing go wrong, and they are kept apart:
 *
 *  - an **error** means the row did not go in, and says why;
 *  - a **warning** means it did, but something in it could not be used —
 *    an unreadable email address, a supplier we have never heard of.
 *
 * Rolling the second into the first would have people chasing rows that are
 * already safely in; leaving it out altogether would lose data quietly, which
 * is worse.
 */

/** Five megabytes is about forty thousand customers. Past that, split the file. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 10_000;
/** A wrongly mapped file fails every row; a list of ten thousand helps nobody. */
const MAX_STORED_ISSUES = 200;

export type ImportMode = 'create' | 'update';

export type Issue = { row: number; message: string };

export type PreviewRecord = {
  row: number;
  cells: Array<{ label: string; value: string }>;
  lines: number;
  /** Whether this one is already in the workspace. */
  existing: boolean;
  /** Whether this one will be left out, so the table cannot imply otherwise. */
  refused: boolean;
};

export type ImportPreview = {
  dataset: ImportDatasetKey;
  headers: string[];
  mapping: ColumnMap;
  unmapped: string[];
  /** Labels of required fields that no column feeds. Nothing can run until empty. */
  missing: string[];
  totalRows: number;
  totalRecords: number;
  existingRecords: number;
  sample: PreviewRecord[];
  errors: Issue[];
  warnings: Issue[];
  errorCount: number;
  warningCount: number;
};

export type ImportOutcome = {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  totalRecords: number;
  errors: Issue[];
  warnings: Issue[];
  errorCount: number;
  warningCount: number;
};

/* ── Planning ─────────────────────────────────────────────────────────────── */

type Plan =
  | { kind: 'create'; row: number; data: Record<string, unknown>; lines?: unknown[] }
  | { kind: 'update'; row: number; id: string; data: Record<string, unknown> }
  | { kind: 'skip'; row: number }
  | { kind: 'error'; row: number; message: string };

type Planned = {
  dataset: ImportDataset;
  records: ReadRecord[];
  plans: Plan[];
  warnings: Issue[];
  existingRecords: number;
};

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed.slice(0, max);
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, parsed));
}

function partyStatus(value: unknown): PartyStatus {
  return value === 'INACTIVE' || value === 'BLOCKED' ? value : 'ACTIVE';
}

/** Only an address we could actually send to. Anything else is dropped, loudly. */
function usableEmail(value: unknown): string | null {
  const candidate = text(value, 160)?.toLowerCase() ?? null;
  if (!candidate) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

function keyOf(value: unknown): string | null {
  const candidate = text(value, 200);
  return candidate ? candidate.toLowerCase() : null;
}

/**
 * The file arguing with itself.
 *
 * Two rows claiming the same code would collide on the unique index and take
 * the whole batch down with them, so the second is refused here, by row number,
 * while the first goes in.
 */
function duplicateGuard() {
  const seen = new Map<string, number>();
  return (row: number, keys: Array<string | null>): number | null => {
    for (const key of keys) {
      if (!key) continue;
      const first = seen.get(key);
      if (first !== undefined && first !== row) return first;
    }
    for (const key of keys) {
      if (key) seen.set(key, row);
    }
    return null;
  };
}

/* ── Per-dataset planners ─────────────────────────────────────────────────── */

const PARTY_TEXT = [
  ['companyName', 120],
  ['phone', 40],
  ['website', 160],
  ['taxId', 60],
  ['addressLine1', 160],
  ['addressLine2', 160],
  ['city', 80],
  ['state', 80],
  ['postalCode', 24],
  ['country', 80],
  ['notes', 2000],
] as const;

async function planParties(
  organizationId: string,
  dataset: ImportDataset,
  records: ReadRecord[],
  mode: ImportMode,
): Promise<Omit<Planned, 'dataset' | 'records'>> {
  const isCustomer = dataset.key === 'customers';

  /*
    Every existing record's keys, in one query rather than one query per row.
    It is four columns, and a workspace with forty thousand customers costs a
    few megabytes to hold for the length of the import — against forty thousand
    round trips, which on a hosted database is the difference between a minute
    and an afternoon.
  */
  const existing = isCustomer
    ? await db.customer.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, externalId: true, email: true, name: true },
      })
    : await db.supplier.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, externalId: true, email: true, name: true },
      });

  const byExternal = new Map<string, string>();
  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const row of existing) {
    if (row.externalId) byExternal.set(row.externalId.toLowerCase(), row.id);
    if (row.email) byEmail.set(row.email.toLowerCase(), row.id);
    byName.set(row.name.toLowerCase(), row.id);
  }

  const plans: Plan[] = [];
  const warnings: Issue[] = [];
  const duplicate = duplicateGuard();
  let existingRecords = 0;

  for (const record of records) {
    const { row, values } = record;
    const name = text(values.name, 80);
    if (!name) {
      plans.push({ kind: 'error', row, message: 'No name — every record needs one' });
      continue;
    }

    const externalId = text(values.externalId, 120);
    const email = usableEmail(values.email);
    if (values.email && !email) {
      warnings.push({ row, message: `Email “${String(values.email)}” is not usable, so it was left blank` });
    }

    const clash = duplicate(row, [
      externalId ? `x:${externalId.toLowerCase()}` : null,
      email ? `e:${email}` : null,
      `n:${name.toLowerCase()}`,
    ]);
    if (clash !== null) {
      plans.push({ kind: 'error', row, message: `Same record as row ${clash}, further up this file` });
      continue;
    }

    const found =
      (externalId ? byExternal.get(externalId.toLowerCase()) : undefined) ??
      (email ? byEmail.get(email) : undefined) ??
      byName.get(name.toLowerCase());

    const data: Record<string, unknown> = {
      name,
      email,
      status: partyStatus(values.status),
      paymentTermDays: clampInt(values.paymentTermDays, isCustomer ? 14 : 30, 0, 365),
    };
    for (const [field, max] of PARTY_TEXT) {
      if (field === 'addressLine2' && !isCustomer) continue;
      if (field in values) data[field] = text(values[field], max);
    }
    if (externalId) data.externalId = externalId;

    if (isCustomer) {
      if ('currency' in values) {
        data.currency = text(values.currency, 8)?.toUpperCase() ?? null;
      }
      if ('creditLimit' in values) {
        const limit = values.creditLimit;
        data.creditLimit = typeof limit === 'number' ? Math.max(0, round(limit)) : null;
      }
      if (Array.isArray(values.tags)) {
        data.tags = (values.tags as string[]).map((tag) => tag.slice(0, 30));
      }
    }

    if (found) {
      existingRecords += 1;
      if (mode === 'create') {
        plans.push({ kind: 'skip', row });
      } else {
        plans.push({ kind: 'update', row, id: found, data });
      }
      continue;
    }

    plans.push({ kind: 'create', row, data });
  }

  return { plans, warnings, existingRecords };
}

async function planCategories(
  organizationId: string,
  records: ReadRecord[],
  mode: ImportMode,
): Promise<Omit<Planned, 'dataset' | 'records'>> {
  const existing = await db.productCategory.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, externalId: true, name: true },
  });

  const byExternal = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const row of existing) {
    if (row.externalId) byExternal.set(row.externalId.toLowerCase(), row.id);
    byName.set(row.name.toLowerCase(), row.id);
  }

  const plans: Plan[] = [];
  const duplicate = duplicateGuard();
  let existingRecords = 0;

  for (const { row, values } of records) {
    const name = text(values.name, 60);
    if (!name) {
      plans.push({ kind: 'error', row, message: 'No name — every category needs one' });
      continue;
    }

    const externalId = text(values.externalId, 120);
    const clash = duplicate(row, [`n:${name.toLowerCase()}`]);
    if (clash !== null) {
      plans.push({ kind: 'error', row, message: `Same category as row ${clash}, further up this file` });
      continue;
    }

    const data: Record<string, unknown> = {
      name,
      description: text(values.description, 500),
    };
    if (externalId) data.externalId = externalId;

    const found =
      (externalId ? byExternal.get(externalId.toLowerCase()) : undefined) ??
      byName.get(name.toLowerCase());

    if (found) {
      existingRecords += 1;
      plans.push(mode === 'create' ? { kind: 'skip', row } : { kind: 'update', row, id: found, data });
      continue;
    }

    plans.push({ kind: 'create', row, data });
  }

  return { plans, warnings: [], existingRecords };
}

const SKU_SHAPE = /^[A-Za-z0-9._/-]+$/;

async function planProducts(
  organizationId: string,
  records: ReadRecord[],
  mode: ImportMode,
): Promise<Omit<Planned, 'dataset' | 'records'>> {
  const [existing, categories, suppliers] = await Promise.all([
    db.product.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, externalId: true, sku: true },
    }),
    db.productCategory.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
    }),
    db.supplier.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const byExternal = new Map<string, string>();
  const bySku = new Map<string, string>();
  for (const row of existing) {
    if (row.externalId) byExternal.set(row.externalId.toLowerCase(), row.id);
    bySku.set(row.sku.toLowerCase(), row.id);
  }
  const categoryByName = new Map(categories.map((row) => [row.name.toLowerCase(), row.id]));
  const supplierByName = new Map(suppliers.map((row) => [row.name.toLowerCase(), row.id]));

  const plans: Plan[] = [];
  const warnings: Issue[] = [];
  const duplicate = duplicateGuard();
  let existingRecords = 0;

  // Categories named by a product but not yet here. Created up front, so that
  // a file of items can be loaded without a separate categories file first.
  const wanted = new Map<string, string>();
  for (const { values } of records) {
    const label = text(values.categoryName, 60);
    if (label && !categoryByName.has(label.toLowerCase())) {
      wanted.set(label.toLowerCase(), label);
    }
  }
  if (wanted.size > 0) {
    await db.productCategory.createMany({
      data: [...wanted.values()].map((name) => ({ organizationId, name })),
      skipDuplicates: true,
    });
    const refreshed = await db.productCategory.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
    });
    categoryByName.clear();
    for (const row of refreshed) categoryByName.set(row.name.toLowerCase(), row.id);
  }

  for (const { row, values } of records) {
    const sku = text(values.sku, 40);
    if (!sku) {
      plans.push({ kind: 'error', row, message: 'No product code — every product needs one' });
      continue;
    }
    if (!SKU_SHAPE.test(sku)) {
      plans.push({
        kind: 'error',
        row,
        message: `Product code “${sku}” has characters we cannot use — letters, numbers, dots, dashes and slashes only`,
      });
      continue;
    }

    const externalId = text(values.externalId, 120);
    const clash = duplicate(row, [
      `s:${sku.toLowerCase()}`,
      externalId ? `x:${externalId.toLowerCase()}` : null,
    ]);
    if (clash !== null) {
      plans.push({ kind: 'error', row, message: `Same product code as row ${clash}, further up this file` });
      continue;
    }

    let name = text(values.name, 120);
    if (!name) {
      name = sku;
      warnings.push({ row, message: `No name, so this product is called “${sku}” after its code` });
    }

    const tracked =
      typeof values.trackInventory === 'boolean' ? values.trackInventory : values.type !== 'SERVICE';
    const type: ProductType =
      values.type === 'SERVICE' || values.type === 'GOOD'
        ? (values.type as ProductType)
        : tracked
          ? 'GOOD'
          : 'SERVICE';

    let categoryId: string | null = null;
    const categoryName = text(values.categoryName, 60);
    if (categoryName) categoryId = categoryByName.get(categoryName.toLowerCase()) ?? null;

    let supplierId: string | null = null;
    const supplierName = text(values.supplierName, 80);
    if (supplierName) {
      supplierId = supplierByName.get(supplierName.toLowerCase()) ?? null;
      if (!supplierId) {
        warnings.push({
          row,
          message: `No supplier called “${supplierName}” here, so this product has none set`,
        });
      }
    }

    const data: Record<string, unknown> = {
      sku,
      name,
      description: text(values.description, 2000),
      barcode: text(values.barcode, 60),
      type,
      trackInventory: type === 'SERVICE' ? false : tracked,
      unit: text(values.unit, 20) ?? 'unit',
      categoryId,
      supplierId,
      purchasePrice: Math.max(0, round(num(values.purchasePrice))),
      sellingPrice: Math.max(0, round(num(values.sellingPrice))),
      taxRate: Math.min(100, Math.max(0, num(values.taxRate))),
      minStockLevel: Math.max(0, num(values.minStockLevel)),
      status: partyStatus(values.status),
    };
    if (externalId) data.externalId = externalId;

    const found =
      (externalId ? byExternal.get(externalId.toLowerCase()) : undefined) ??
      bySku.get(sku.toLowerCase());

    if (found) {
      existingRecords += 1;
      if (mode === 'create') {
        plans.push({ kind: 'skip', row });
      } else {
        // Stock is deliberately not part of an update. It is a live number that
        // moves with every sale, and a file re-run to correct a price must not
        // quietly wind it back to what it was on the day of the export.
        if (values.stockQuantity !== undefined && values.stockQuantity !== null) {
          warnings.push({
            row,
            message: 'Already here, so the price and details were updated but the stock level was left as it is',
          });
        }
        plans.push({ kind: 'update', row, id: found, data });
      }
      continue;
    }

    const opening = data.trackInventory ? Math.max(0, num(values.stockQuantity)) : 0;
    plans.push({ kind: 'create', row, data: { ...data, stockQuantity: opening }, lines: [opening] });
  }

  return { plans, warnings, existingRecords };
}

/**
 * Invoices, which are the reason anybody migrates at all: the list of who owes
 * what.
 *
 * There is no update mode here, deliberately. An invoice is a statement of what
 * was owed on a particular day, and a file re-run to fix a typo must not go
 * back and restate it. One already here is left exactly as it is.
 */
async function planInvoices(
  organizationId: string,
  records: ReadRecord[],
): Promise<Omit<Planned, 'dataset' | 'records'>> {
  const [organization, existing, customers, products] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { currency: true },
    }),
    db.invoice.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, number: true },
    }),
    db.customer.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, externalId: true, name: true, paymentTermDays: true },
    }),
    db.product.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, sku: true },
    }),
  ]);

  const byNumber = new Map(existing.map((row) => [row.number.toLowerCase(), row.id]));
  const customerByExternal = new Map<string, (typeof customers)[number]>();
  const customerByName = new Map<string, (typeof customers)[number]>();
  for (const row of customers) {
    if (row.externalId) customerByExternal.set(row.externalId.toLowerCase(), row);
    customerByName.set(row.name.toLowerCase(), row);
  }
  const productBySku = new Map(products.map((row) => [row.sku.toLowerCase(), row.id]));

  const plans: Plan[] = [];
  const warnings: Issue[] = [];
  const duplicate = duplicateGuard();
  let existingRecords = 0;

  for (const record of records) {
    const { row, values, lines } = record;

    const number = text(values.number, 60);
    if (!number) {
      plans.push({ kind: 'error', row, message: 'No invoice number' });
      continue;
    }

    const clash = duplicate(row, [`n:${number.toLowerCase()}`]);
    if (clash !== null) {
      plans.push({ kind: 'error', row, message: `Invoice ${number} is already on row ${clash} of this file` });
      continue;
    }

    if (byNumber.has(number.toLowerCase())) {
      existingRecords += 1;
      // An invoice is a statement of what was owed on a day. Rewriting one from
      // a re-run of a file would change history, so it is left alone whichever
      // mode this is.
      plans.push({ kind: 'skip', row });
      continue;
    }

    const customerName = text(values.customerName, 120);
    if (!customerName) {
      plans.push({ kind: 'error', row, message: `Invoice ${number} names no customer` });
      continue;
    }

    const customer =
      customerByExternal.get(customerName.toLowerCase()) ??
      customerByName.get(customerName.toLowerCase());
    if (!customer) {
      plans.push({
        kind: 'error',
        row,
        message: `No customer called “${customerName}” here — import your customers first`,
      });
      continue;
    }

    const issueDate = values.issueDate instanceof Date ? values.issueDate : null;
    if (!issueDate) {
      plans.push({ kind: 'error', row, message: `Invoice ${number} has no date we could read` });
      continue;
    }

    let dueDate = values.dueDate instanceof Date ? values.dueDate : null;
    if (!dueDate) {
      dueDate = addDays(issueDate, customer.paymentTermDays);
      warnings.push({
        row,
        message: `Invoice ${number} had no due date, so ${customer.paymentTermDays} days were allowed from its date`,
      });
    }

    const items: Array<{
      productId: string | null;
      name: string;
      description: string | null;
      quantity: number;
      unit: string;
      unitPrice: number;
      discountRate: number;
      taxRate: number;
    }> = [];

    let lineProblem: string | null = null;

    for (const line of lines) {
      const lineRow = typeof line.__row === 'number' ? line.__row : row;
      const sku = text(line.lineSku, 40);
      const label = text(line.lineName, 200) ?? sku;
      if (!label) {
        lineProblem = `a line on row ${lineRow} has neither a description nor a product code`;
        break;
      }

      const quantity = num(line.lineQuantity, 0);
      if (quantity <= 0) {
        lineProblem = `the line “${label}” on row ${lineRow} has no quantity`;
        break;
      }

      let productId: string | null = null;
      if (sku) {
        productId = productBySku.get(sku.toLowerCase()) ?? null;
        if (!productId) {
          warnings.push({
            row: lineRow,
            message: `No product with code “${sku}” here, so that line was kept as text`,
          });
        }
      }

      items.push({
        productId,
        name: label,
        description: null,
        quantity,
        unit: text(line.lineUnit, 20) ?? 'unit',
        unitPrice: round(Math.max(0, num(line.lineUnitPrice))),
        discountRate: Math.min(100, Math.max(0, num(line.lineDiscountRate))),
        taxRate: Math.min(100, Math.max(0, num(line.lineTaxRate))),
      });
    }

    if (lineProblem) {
      plans.push({ kind: 'error', row, message: `Invoice ${number} was left out because ${lineProblem}` });
      continue;
    }

    if (items.length === 0) {
      plans.push({ kind: 'error', row, message: `Invoice ${number} has no lines` });
      continue;
    }

    const discountValue = Math.max(0, round(num(values.discountValue)));
    const totals = calculateDocumentTotals({
      lines: items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountRate: item.discountRate,
        taxRate: item.taxRate,
      })),
      discountType: 'FIXED',
      discountValue,
    });

    const amountPaid = Math.min(totals.total, Math.max(0, round(num(values.amountPaid))));
    const balanceDue = round(totals.total - amountPaid);

    // The status on the file is a starting point; what has actually been paid
    // decides it, so a row marked unpaid with the money in cannot come through
    // as owing.
    const declared = typeof values.status === 'string' ? (values.status as InvoiceStatus) : 'SENT';
    const status: InvoiceStatus =
      declared === 'DRAFT' || declared === 'CANCELLED'
        ? declared
        : balanceDue <= 0
          ? 'PAID'
          : amountPaid > 0
            ? 'PARTIALLY_PAID'
            : dueDate < new Date()
              ? 'OVERDUE'
              : declared;

    plans.push({
      kind: 'create',
      row,
      data: {
        number,
        customerId: customer.id,
        status,
        issueDate,
        dueDate,
        subtotal: totals.subtotal,
        discountType: 'FIXED',
        discountValue,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        shippingAmount: 0,
        currency: organization.currency,
        total: totals.total,
        amountPaid,
        balanceDue,
        paidAt: balanceDue <= 0 ? issueDate : null,
        sentAt: status === 'DRAFT' ? null : issueDate,
        reference: text(values.reference, 120),
        notes: text(values.notes, 2000),
        terms: text(values.terms, 2000),
      },
      lines: items.map((item, index) => ({
        ...item,
        lineSubtotal: totals.lines[index].lineSubtotal,
        lineDiscount: totals.lines[index].lineDiscount,
        lineTax: totals.lines[index].lineTax,
        lineTotal: totals.lines[index].lineTotal,
        sortOrder: index,
      })),
    });

    /*
      The workspace keeps one set of books in one currency, so an invoice
      arrives in that currency whatever the file says. Saying so matters only
      when the two differ: the figures then stand as written and have not been
      converted, which somebody has to know before they act on the total.
    */
    const declaredCurrency =
      typeof values.currency === 'string' ? values.currency.trim().toUpperCase() : '';
    if (declaredCurrency && declaredCurrency !== organization.currency.toUpperCase()) {
      warnings.push({
        row,
        message: `This invoice is marked ${declaredCurrency}; its figures were taken as ${organization.currency} and not converted`,
      });
    }
  }

  return { plans, warnings, existingRecords };
}

/* ── Reading a file into a plan ───────────────────────────────────────────── */

export class ImportError extends Error {}

type PrepareInput = {
  organizationId: string;
  dataset: ImportDataset;
  text: string;
  mapping?: ColumnMap | null;
  mode: ImportMode;
};

async function prepare(input: PrepareInput): Promise<
  Planned & {
    headers: string[];
    map: ColumnMap;
    totalRows: number;
    readIssues: RowIssue[];
  }
> {
  const { headers, rows } = parseCsv(input.text, detectDelimiter(input.text));

  if (headers.length === 0 || headers.every((header) => header.trim() === '')) {
    throw new ImportError('That file has no column headings on its first line.');
  }
  if (rows.length === 0) {
    throw new ImportError('That file has headings but no rows under them.');
  }
  if (rows.length > MAX_ROWS) {
    throw new ImportError(
      `That file has ${rows.length.toLocaleString()} rows. Split it into files of ${MAX_ROWS.toLocaleString()} or fewer and load them one after another.`,
    );
  }

  const map = input.mapping ?? autoMap(headers, input.dataset);
  const { records, issues } = readRecords(rows, input.dataset, map);

  const planner =
    input.dataset.key === 'invoices'
      ? planInvoices(input.organizationId, records)
      : input.dataset.key === 'products'
        ? planProducts(input.organizationId, records, input.mode)
        : input.dataset.key === 'product-categories'
          ? planCategories(input.organizationId, records, input.mode)
          : planParties(input.organizationId, input.dataset, records, input.mode);

  const planned = await planner;

  return {
    dataset: input.dataset,
    records,
    headers,
    map,
    totalRows: rows.length,
    readIssues: issues,
    ...planned,
  };
}

/** Required fields with no column behind them, by label. */
function missingRequired(dataset: ImportDataset, map: ColumnMap): string[] {
  return dataset.fields
    .filter((field) => field.required && (map[field.key] === null || map[field.key] === undefined))
    .map((field) => field.label);
}

/* ── Preview ──────────────────────────────────────────────────────────────── */

export async function previewImport(input: {
  organizationId: string;
  dataset: ImportDatasetKey;
  text: string;
  mapping?: ColumnMap | null;
  mode: ImportMode;
}): Promise<ImportPreview> {
  const dataset = findDataset(input.dataset);
  if (!dataset) throw new ImportError('That is not something we can import.');

  const prepared = await prepare({ ...input, dataset });

  const errors: Issue[] = [
    ...prepared.readIssues.map((issue) => ({ row: issue.row, message: issue.message })),
    ...prepared.plans
      .filter((plan): plan is Extract<Plan, { kind: 'error' }> => plan.kind === 'error')
      .map((plan) => ({ row: plan.row, message: plan.message })),
  ].sort((a, b) => a.row - b.row);

  const shown = dataset.fields.filter(
    (field) => !field.line && prepared.map[field.key] !== null && prepared.map[field.key] !== undefined,
  );

  const byRow = new Map(prepared.plans.map((plan) => [plan.row, plan]));

  const refusedRows = new Set(errors.map((issue) => issue.row));

  const sample: PreviewRecord[] = prepared.records.slice(0, 8).map((record) => ({
    row: record.row,
    lines: record.lines.length,
    existing: byRow.get(record.row)?.kind === 'update' || byRow.get(record.row)?.kind === 'skip',
    refused: refusedRows.has(record.row),
    cells: shown.slice(0, 6).map((field) => ({
      label: field.label,
      value: display(record.values[field.key]),
    })),
  }));

  return {
    dataset: dataset.key,
    headers: prepared.headers,
    mapping: prepared.map,
    unmapped: unmappedColumns(prepared.headers, prepared.map),
    missing: missingRequired(dataset, prepared.map),
    totalRows: prepared.totalRows,
    totalRecords: prepared.records.length,
    existingRecords: prepared.existingRecords,
    sample,
    errors: errors.slice(0, 25),
    warnings: prepared.warnings.slice(0, 25),
    errorCount: errors.length,
    warningCount: prepared.warnings.length,
  };
}

function display(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value);
  return text.trim() === '' ? '—' : text;
}

/* ── Running ──────────────────────────────────────────────────────────────── */

/** Small enough that one failure loses little, large enough to be one round trip. */
const CHUNK = 100;

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function runImport(input: {
  organizationId: string;
  userId: string;
  dataset: ImportDatasetKey;
  fileName: string;
  text: string;
  mapping: ColumnMap;
  mode: ImportMode;
}): Promise<ImportOutcome> {
  const dataset = findDataset(input.dataset);
  if (!dataset) throw new ImportError('That is not something we can import.');

  const prepared = await prepare({ ...input, dataset });

  const missing = missingRequired(dataset, prepared.map);
  if (missing.length > 0) {
    throw new ImportError(
      `Nothing was imported: ${missing.join(' and ')} ${missing.length === 1 ? 'has' : 'have'} no column pointing at ${missing.length === 1 ? 'it' : 'them'}.`,
    );
  }

  const errors: Issue[] = [
    ...prepared.readIssues.map((issue) => ({ row: issue.row, message: issue.message })),
    ...prepared.plans
      .filter((plan): plan is Extract<Plan, { kind: 'error' }> => plan.kind === 'error')
      .map((plan) => ({ row: plan.row, message: plan.message })),
  ];
  const warnings = [...prepared.warnings];

  const creates = prepared.plans.filter(
    (plan): plan is Extract<Plan, { kind: 'create' }> => plan.kind === 'create',
  );
  const updates = prepared.plans.filter(
    (plan): plan is Extract<Plan, { kind: 'update' }> => plan.kind === 'update',
  );
  const skipped = prepared.plans.filter((plan) => plan.kind === 'skip').length;

  let created = 0;
  let updated = 0;

  const fail = (rows: number[], message: string) => {
    for (const row of rows) errors.push({ row, message });
  };

  for (const batch of chunks(creates)) {
    try {
      created += await writeCreates(input.organizationId, dataset, batch);
    } catch (error) {
      console.error('Import batch failed', { dataset: dataset.key, error });
      fail(batch.map((plan) => plan.row), reasonFor(error));
    }
  }

  for (const batch of chunks(updates)) {
    try {
      updated += await writeUpdates(input.organizationId, dataset, batch);
    } catch (error) {
      console.error('Import update batch failed', { dataset: dataset.key, error });
      fail(batch.map((plan) => plan.row), reasonFor(error));
    }
  }

  errors.sort((a, b) => a.row - b.row);
  warnings.sort((a, b) => a.row - b.row);

  const run = await db.importRun.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      dataset: dataset.key,
      fileName: input.fileName.slice(0, 200),
      mode: input.mode,
      mapping: readableMapping(prepared.headers, prepared.map) as Prisma.InputJsonValue,
      totalRows: prepared.records.length,
      created,
      updated,
      skipped,
      failed: new Set(errors.map((issue) => issue.row)).size,
      errors: {
        errors: errors.slice(0, MAX_STORED_ISSUES),
        warnings: warnings.slice(0, MAX_STORED_ISSUES),
      } as Prisma.InputJsonValue,
      finishedAt: new Date(),
    },
    select: { id: true },
  });

  return {
    runId: run.id,
    created,
    updated,
    skipped,
    failed: new Set(errors.map((issue) => issue.row)).size,
    totalRecords: prepared.records.length,
    errors: errors.slice(0, 25),
    warnings: warnings.slice(0, 25),
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

/** Their column heading against our field label, for the run's own record. */
function readableMapping(headers: string[], map: ColumnMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, index] of Object.entries(map)) {
    if (index === null || index === undefined) continue;
    out[field] = headers[index] ?? `Column ${index + 1}`;
  }
  return out;
}

function reasonFor(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'P2002') return 'Already here under the same code or name';
  if (code === 'P2003') return 'Points at something that is no longer here';
  return 'The database refused this row';
}

async function writeCreates(
  organizationId: string,
  dataset: ImportDataset,
  batch: Array<Extract<Plan, { kind: 'create' }>>,
): Promise<number> {
  switch (dataset.key) {
    case 'customers': {
      const result = await db.customer.createMany({
        data: batch.map((plan) => ({
          ...(plan.data as Prisma.CustomerCreateManyInput),
          organizationId,
        })),
      });
      return result.count;
    }

    case 'suppliers': {
      const result = await db.supplier.createMany({
        data: batch.map((plan) => ({
          ...(plan.data as Prisma.SupplierCreateManyInput),
          organizationId,
        })),
      });
      return result.count;
    }

    case 'product-categories': {
      const result = await db.productCategory.createMany({
        data: batch.map((plan) => ({
          ...(plan.data as Prisma.ProductCategoryCreateManyInput),
          organizationId,
        })),
      });
      return result.count;
    }

    case 'products': {
      // One statement per product rather than a `createMany`, because an
      // opening stock level has to arrive with the movement that explains it.
      // A quantity sitting in a column with no history behind it is the sort of
      // number nobody can ever account for afterwards.
      const written = await db.$transaction(
        batch.map((plan) => {
          const data = plan.data as Prisma.ProductCreateManyInput;
          const opening = Number(data.stockQuantity ?? 0);
          return db.product.create({
            data: {
              ...(data as Prisma.ProductCreateManyInput),
              organizationId,
              ...(opening > 0
                ? {
                    inventoryTx: {
                      create: [
                        {
                          organizationId,
                          type: 'ADJUSTMENT',
                          quantity: opening,
                          balanceAfter: opening,
                          reason: 'Opening balance, imported',
                        },
                      ],
                    },
                  }
                : {}),
            } as Prisma.ProductUncheckedCreateInput,
            select: { id: true },
          });
        }),
      );
      return written.length;
    }

    case 'invoices': {
      const written = await db.$transaction(
        batch.map((plan) =>
          db.invoice.create({
            data: {
              ...(plan.data as Prisma.InvoiceCreateManyInput),
              organizationId,
              items: {
                create: plan.lines as Prisma.InvoiceItemUncheckedCreateWithoutInvoiceInput[],
              },
            } as Prisma.InvoiceUncheckedCreateInput,
            select: { id: true },
          }),
        ),
      );
      return written.length;
    }

    default:
      return 0;
  }
}

async function writeUpdates(
  organizationId: string,
  dataset: ImportDataset,
  batch: Array<Extract<Plan, { kind: 'update' }>>,
): Promise<number> {
  // `updateMany` scoped by organizationId, not `update` by id: an id that
  // belongs to another workspace then matches nothing instead of being written.
  const results = await db.$transaction(
    batch.map((plan) => {
      const where = { id: plan.id, organizationId, deletedAt: null };
      switch (dataset.key) {
        case 'customers':
          return db.customer.updateMany({ where, data: plan.data as Prisma.CustomerUpdateManyMutationInput });
        case 'suppliers':
          return db.supplier.updateMany({ where, data: plan.data as Prisma.SupplierUpdateManyMutationInput });
        case 'product-categories':
          return db.productCategory.updateMany({
            where,
            data: plan.data as Prisma.ProductCategoryUpdateManyMutationInput,
          });
        case 'products':
          return db.product.updateMany({ where, data: plan.data as Prisma.ProductUpdateManyMutationInput });
        default:
          // Invoices are never planned as updates, so nothing reaches here.
          throw new ImportError(`${dataset.label} cannot be updated by an import.`);
      }
    }),
  );
  return results.reduce((total, result) => total + result.count, 0);
}

/* ── History ──────────────────────────────────────────────────────────────── */

export type ImportRunRow = {
  id: string;
  dataset: string;
  datasetLabel: string;
  fileName: string;
  mode: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  totalRows: number;
  startedAt: string;
};

export async function listImportRuns(
  organizationId: string,
  limit = 10,
): Promise<ImportRunRow[]> {
  const rows = await db.importRun.findMany({
    where: { organizationId },
    orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    dataset: row.dataset,
    datasetLabel: findDataset(row.dataset)?.label ?? row.dataset,
    fileName: row.fileName,
    mode: row.mode,
    created: row.created,
    updated: row.updated,
    skipped: row.skipped,
    failed: row.failed,
    totalRows: row.totalRows,
    startedAt: row.startedAt.toISOString(),
  }));
}

export async function getImportRun(organizationId: string, id: string) {
  return db.importRun.findFirst({ where: { id, organizationId } });
}

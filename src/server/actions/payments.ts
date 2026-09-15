'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { recordPaymentSchema } from '@/lib/validations/document';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity, notify } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { deriveStatus } from '@/server/services/invoices';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { round, toNumber } from '@/lib/money';

/**
 * Records a customer payment against an invoice.
 *
 * One transaction writes the payment, moves the invoice's paid and outstanding
 * amounts, re-derives its status, posts a ledger entry and moves the account
 * balance — so the invoice, the books and the bank balance can never disagree.
 */
export async function recordPaymentAction(
  input: unknown,
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('payments.create');

    const parsed = recordPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the payment details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: data.invoiceId,
          organizationId: organization.id,
          deletedAt: null,
        },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          amountPaid: true,
          dueDate: true,
          customerId: true,
          customer: { select: { name: true, companyName: true } },
        },
      });
      if (!invoice) {
        return { ok: false as const, error: 'That invoice no longer exists.' };
      }
      if (invoice.status === 'DRAFT') {
        return {
          ok: false as const,
          error: 'Send the invoice before recording a payment against it.',
        };
      }
      if (invoice.status === 'CANCELLED') {
        return {
          ok: false as const,
          error: 'This invoice is cancelled, so it cannot take a payment.',
        };
      }

      const total = toNumber(invoice.total);
      const alreadyPaid = toNumber(invoice.amountPaid);
      const outstanding = round(total - alreadyPaid);

      if (outstanding <= 0) {
        return { ok: false as const, error: 'This invoice is already settled.' };
      }
      if (data.amount > outstanding) {
        return {
          ok: false as const,
          error: `That is more than the ${outstanding.toFixed(2)} outstanding on this invoice.`,
        };
      }

      const account = await tx.account.findFirst({
        where: { id: data.accountId, organizationId: organization.id, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!account) {
        return { ok: false as const, error: 'That account no longer exists.' };
      }

      const paidAt = new Date(data.paidAt);
      const number = await nextDocumentNumber(tx, organization.id, 'payment', {
        date: paidAt,
      });

      const payment = await tx.payment.create({
        data: {
          organizationId: organization.id,
          number,
          direction: 'INCOMING',
          method: data.method,
          amount: data.amount,
          currency: organization.currency,
          paidAt,
          reference: data.reference || null,
          notes: data.notes || null,
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          accountId: account.id,
          createdById: user.id,
        },
        select: { id: true, number: true },
      });

      const amountPaid = round(alreadyPaid + data.amount);
      const balanceDue = round(total - amountPaid);
      const status = deriveStatus(
        invoice.status,
        total,
        amountPaid,
        invoice.dueDate,
      );

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid,
          balanceDue,
          status,
          paidAt: balanceDue <= 0 ? paidAt : null,
        },
      });

      await tx.transaction.create({
        data: {
          organizationId: organization.id,
          accountId: account.id,
          type: 'INCOME',
          amount: data.amount,
          currency: organization.currency,
          description: `Payment received for ${invoice.number}`,
          category: 'Sales',
          occurredAt: paidAt,
          reference: payment.number,
          invoiceId: invoice.id,
          paymentId: payment.id,
          customerId: invoice.customerId,
          createdById: user.id,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: { currentBalance: { increment: data.amount } },
      });

      return { ok: true as const, payment, invoice, status, balanceDue };
    });

    if (!result.ok) return actionError(result.error);

    const customerName =
      result.invoice.customer.companyName ?? result.invoice.customer.name;

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'payment',
      entityType: 'invoice',
      entityId: result.invoice.id,
      summary: `Recorded ${data.amount} against ${result.invoice.number} from ${customerName}`,
    });

    if (result.balanceDue <= 0) {
      await notify({
        organizationId: organization.id,
        type: 'INVOICE_PAID',
        title: `${result.invoice.number} settled in full`,
        body: `${customerName} has paid this invoice.`,
        href: `/invoices/${result.invoice.id}`,
      });
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${result.invoice.id}`);
    revalidatePath('/payments');
    revalidatePath('/dashboard');
    return actionOk({ id: result.payment.id, number: result.payment.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Reverses a payment: removes it, restores the invoice balance and status,
 * deletes its ledger entry and moves the account balance back.
 */
export async function deletePaymentAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('payments.delete');

    const result = await db.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id, organizationId: organization.id, deletedAt: null },
        select: {
          id: true,
          number: true,
          amount: true,
          accountId: true,
          invoiceId: true,
        },
      });
      if (!payment) {
        return { ok: false as const, error: 'That payment no longer exists.' };
      }

      const amount = toNumber(payment.amount);

      await tx.transaction.deleteMany({ where: { paymentId: payment.id } });
      await tx.payment.update({
        where: { id: payment.id },
        data: { deletedAt: new Date() },
      });

      if (payment.accountId) {
        await tx.account.update({
          where: { id: payment.accountId },
          data: { currentBalance: { decrement: amount } },
        });
      }

      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: payment.invoiceId },
          select: {
            id: true,
            status: true,
            total: true,
            amountPaid: true,
            dueDate: true,
          },
        });

        if (invoice) {
          const total = toNumber(invoice.total);
          const amountPaid = Math.max(0, round(toNumber(invoice.amountPaid) - amount));
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid,
              balanceDue: round(total - amountPaid),
              status: deriveStatus(invoice.status, total, amountPaid, invoice.dueDate),
              paidAt: amountPaid >= total && total > 0 ? undefined : null,
            },
          });
        }
      }

      return { ok: true as const, payment };
    });

    if (!result.ok) return actionError(result.error);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'payment',
      entityId: id,
      summary: `Reversed payment ${result.payment.number}`,
    });

    revalidatePath('/payments');
    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Re-derives overdue status across the organization.
 *
 * Status depends on the current date, so an invoice becomes overdue with the
 * passage of time rather than through any user action. Called when the invoice
 * list is opened.
 */
export async function refreshOverdueInvoices(organizationId: string) {
  const now = new Date();
  await db.invoice.updateMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: ['SENT', 'VIEWED'] },
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });
}

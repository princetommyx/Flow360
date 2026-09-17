'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { AuthorizationError, requireTenant } from '@/server/tenant';
import { createCustomerAction } from '@/server/actions/customers';
import { createInvoiceAction } from '@/server/actions/invoices';
import { createQuotationAction } from '@/server/actions/quotations';
import { recordPaymentAction } from '@/server/actions/payments';
import { saveAttendanceAction } from '@/server/actions/attendance';
import { createEmployeeAction } from '@/server/actions/employees';
import { createPayrollAction } from '@/server/actions/payroll';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * Turning a draft into a record.
 *
 * This is the only door. Every drafting tool the assistant has ends at a row in
 * `assistant_proposals` and stops; nothing crosses into the business tables
 * except through here, and what runs here is the ordinary server action a
 * person's own click would have run.
 *
 * That is the whole safety argument, and it is worth stating plainly: the
 * permission check, the stock check, the numbering, the notification and the
 * activity log are not reimplemented for the assistant, so they cannot drift
 * from what the forms do. The assistant fills a form in. A person presses the
 * button.
 */

type Runner = (input: unknown) => Promise<ActionResult<{ id: string; number?: string }>>;

/**
 * Where each kind goes, and what the person is shown afterwards.
 *
 * A kind with no entry here cannot be confirmed at all, which is what makes a
 * tampered-with row inert rather than dangerous.
 */
const RUNNERS: Record<
  string,
  { run: Runner; label: (result: { id: string; number?: string }) => string; href: (id: string) => string; revalidate: string[] }
> = {
  'invoice.create': {
    run: (input) => createInvoiceAction(input),
    label: (result) => `Invoice ${result.number ?? ''}`.trim(),
    href: (id) => `/invoices/${id}`,
    revalidate: ['/invoices', '/dashboard'],
  },
  'quotation.create': {
    run: (input) => createQuotationAction(input),
    label: (result) => `Quotation ${result.number ?? ''}`.trim(),
    href: (id) => `/quotations/${id}`,
    revalidate: ['/quotations'],
  },
  'customer.create': {
    run: (input) => createCustomerAction(input),
    label: () => 'Customer added',
    href: (id) => `/customers/${id}`,
    revalidate: ['/customers'],
  },
  'payment.record': {
    run: (input) => recordPaymentAction(input),
    label: (result) => `Payment ${result.number ?? ''}`.trim(),
    href: (id) => `/payments/${id}`,
    revalidate: ['/payments', '/invoices', '/dashboard'],
  },
  'attendance.save': {
    run: async (input) => {
      const result = await saveAttendanceAction(input);
      return result.ok ? actionOk({ id: '' }) : result;
    },
    label: () => 'Attendance saved',
    href: () => '/attendance',
    revalidate: ['/attendance'],
  },
  'employee.create': {
    run: (input) => createEmployeeAction(input),
    label: () => 'Employee added',
    href: (id) => `/employees/${id}`,
    revalidate: ['/employees'],
  },
  'payroll.create': {
    run: (input) => createPayrollAction(input),
    label: (result) => `Payslip ${result.number ?? ''}`.trim(),
    href: () => '/payroll',
    revalidate: ['/payroll'],
  },
};

export type ProposalOutcome = {
  status: 'confirmed' | 'cancelled';
  resultLabel: string | null;
  resultHref: string | null;
};

export async function confirmProposalAction(
  id: string,
): Promise<ActionResult<ProposalOutcome>> {
  try {
    const context = await requireTenant();

    const proposal = await db.assistantProposal.findFirst({
      where: {
        id,
        organizationId: context.organization.id,
        // Drafted for this person, confirmed by this person. A draft is not a
        // work item somebody else can pick up: whoever asked for it is the one
        // who knows what they asked for.
        userId: context.user.id,
      },
    });

    if (!proposal) return actionError('That draft is no longer here.');
    if (proposal.status === 'confirmed') {
      return actionError('That has already been done.');
    }
    if (proposal.status === 'cancelled') {
      return actionError('That draft was discarded.');
    }

    const runner = RUNNERS[proposal.kind];
    if (!runner) {
      return actionError('That draft is of a kind this version cannot create.');
    }

    // The action does its own `requirePermission`, so a role changed between
    // drafting and confirming is caught here rather than trusted from before.
    const result = await runner.run(proposal.input);

    if (!result.ok) {
      await db.assistantProposal.update({
        where: { id: proposal.id },
        data: { status: 'failed', error: result.error },
      });
      return actionError(result.error);
    }

    const label = runner.label(result.data) || 'Done';
    const href = result.data.id ? runner.href(result.data.id) : null;

    await db.assistantProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        resultLabel: label,
        resultHref: href,
      },
    });

    for (const path of runner.revalidate) revalidatePath(path);
    revalidatePath('/assistant');

    return actionOk({ status: 'confirmed', resultLabel: label, resultHref: href });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function cancelProposalAction(id: string): Promise<ActionResult<ProposalOutcome>> {
  try {
    const context = await requireTenant();

    const { count } = await db.assistantProposal.updateMany({
      where: {
        id,
        organizationId: context.organization.id,
        userId: context.user.id,
        status: 'pending',
      },
      data: { status: 'cancelled' },
    });

    if (count === 0) return actionError('That draft is no longer waiting.');

    return actionOk({ status: 'cancelled', resultLabel: null, resultHref: null });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Clears a conversation out. The records it produced are untouched. */
export async function deleteConversationAction(id: string): Promise<ActionResult> {
  try {
    const context = await requireTenant();

    const { count } = await db.conversation.deleteMany({
      where: { id, organizationId: context.organization.id, userId: context.user.id },
    });

    if (count === 0) return actionError('That conversation is no longer here.');

    revalidatePath('/assistant');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

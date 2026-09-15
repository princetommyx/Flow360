'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import {
  companySchema,
  currencyChangeSchema,
} from '@/lib/validations/company';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { changeOrganizationCurrency } from '@/server/services/currency-change';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

export async function updateCompanyAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const parsed = companySchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    await db.organization.update({
      where: { id: organization.id },
      data: {
        name: data.name,
        legalName: data.legalName || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        taxId: data.taxId || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || undefined,
        industry: data.industry || null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: 'Updated the company details',
    });

    revalidatePath('/settings/company');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Changes the currency the workspace trades in.
 *
 * Owner only, and the workspace name has to be typed back. This rewrites every
 * money figure in the workspace in one transaction; a misclick that multiplied
 * an entire set of books by 15 would be a genuinely bad day, and there is no
 * undo beyond converting back at the reciprocal rate.
 */
export async function changeCurrencyAction(
  input: unknown,
): Promise<ActionResult<{ from: string; to: string; rate: number; mode: string }>> {
  try {
    const { organization, user, membership } = await requirePermission('settings.edit');

    if (!membership.isOwner) {
      return actionError('Only the workspace owner can change the currency.');
    }

    const parsed = currencyChangeSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    if (data.confirmation.trim() !== organization.name) {
      return actionError(
        'Type the workspace name exactly as it appears to confirm.',
        'confirmation',
      );
    }

    if (data.to === organization.currency) {
      return actionError(
        `This workspace already keeps its books in ${organization.currency}.`,
        'to',
      );
    }

    const result = await changeOrganizationCurrency(organization.id, {
      to: data.to,
      mode: data.mode,
      rate: data.rate,
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary:
        result.mode === 'convert'
          ? `Converted the books from ${result.from} to ${result.to} at ${result.rate}`
          : `Relabelled the books from ${result.from} to ${result.to} without converting`,
      metadata: { from: result.from, to: result.to, rate: result.rate, mode: result.mode },
    });

    // Money appears on nearly every screen, so none of them is still right.
    revalidatePath('/', 'layout');
    return actionOk(result);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

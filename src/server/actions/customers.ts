'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { customerSchema } from '@/lib/validations/customer';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { nullifyBlanks } from '@/server/actions/utils';

/** Optional text columns: an empty input field stores `null`, not `''`. */
const OPTIONAL_FIELDS = [
  'companyName',
  'email',
  'phone',
  'website',
  'taxId',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
  'notes',
] as const;

export async function createCustomerAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('customers.create');

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const customer = await db.customer.create({
      data: {
        ...nullifyBlanks(parsed.data, OPTIONAL_FIELDS),
        organizationId: organization.id,
      },
      select: { id: true, name: true },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'customer',
      entityId: customer.id,
      summary: `Added customer ${customer.name}`,
    });

    revalidatePath('/customers');
    return actionOk({ id: customer.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateCustomerAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('customers.edit');

    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    // Scope the update by organizationId so an id from another tenant misses.
    const result = await db.customer.updateMany({
      where: { id, organizationId: organization.id, deletedAt: null },
      data: nullifyBlanks(parsed.data, OPTIONAL_FIELDS),
    });

    if (result.count === 0) return actionError('That customer no longer exists.');

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'customer',
      entityId: id,
      summary: `Updated customer ${parsed.data.name}`,
    });

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateCustomerNotesAction(
  id: string,
  notes: string,
): Promise<ActionResult> {
  try {
    const { organization } = await requirePermission('customers.edit');

    const result = await db.customer.updateMany({
      where: { id, organizationId: organization.id, deletedAt: null },
      data: { notes: notes.trim() || null },
    });

    if (result.count === 0) return actionError('That customer no longer exists.');

    revalidatePath(`/customers/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Soft delete. A customer with financial history is archived instead of
 * removed, so invoices and payments keep a valid reference.
 */
export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('customers.delete');

    const customer = await db.customer.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!customer) return actionError('That customer no longer exists.');

    await db.customer.update({
      where: { id: customer.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'customer',
      entityId: id,
      summary: `Removed customer ${customer.name}`,
    });

    revalidatePath('/customers');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

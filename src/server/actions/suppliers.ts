'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { supplierSchema } from '@/lib/validations/supplier';
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
  'city',
  'state',
  'postalCode',
  'country',
  'notes',
] as const;

export async function createSupplierAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('suppliers.create');

    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const supplier = await db.supplier.create({
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
      entityType: 'supplier',
      entityId: supplier.id,
      summary: `Added supplier ${supplier.name}`,
    });

    revalidatePath('/suppliers');
    return actionOk({ id: supplier.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateSupplierAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('suppliers.edit');

    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    // Scope the update by organizationId so an id from another tenant misses.
    const result = await db.supplier.updateMany({
      where: { id, organizationId: organization.id, deletedAt: null },
      data: nullifyBlanks(parsed.data, OPTIONAL_FIELDS),
    });

    if (result.count === 0) return actionError('That supplier no longer exists.');

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'supplier',
      entityId: id,
      summary: `Updated supplier ${parsed.data.name}`,
    });

    revalidatePath('/suppliers');
    revalidatePath(`/suppliers/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Soft delete. A supplier with purchase history is archived rather than
 * removed, so bills, orders and payments keep a valid reference.
 */
export async function deleteSupplierAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('suppliers.delete');

    const supplier = await db.supplier.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!supplier) return actionError('That supplier no longer exists.');

    await db.supplier.update({
      where: { id: supplier.id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'supplier',
      entityId: supplier.id,
      summary: `Removed supplier ${supplier.name}`,
    });

    revalidatePath('/suppliers');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

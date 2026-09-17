'use server';

import { revalidatePath } from 'next/cache';
import { compare, hash } from 'bcryptjs';

import { db } from '@/lib/db';
import {
  invoiceTemplateSchema,
  inviteMemberSchema,
  invoicingSchema,
  memberRoleSchema,
  notificationSettingsSchema,
  roleSchema,
  taxRateSchema,
  taxSettingsSchema,
} from '@/lib/validations/settings';
import { profileSchema, changePasswordSchema } from '@/lib/validations/auth';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { auth } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { absoluteUrl } from '@/lib/url';
import { createToken, expiryFor, TOKEN_TTL_MINUTES } from '@/lib/tokens';
import { teamInviteEmail } from '@/lib/email/templates';
import { slugify } from '@/lib/utils';
import {
  findInvoiceTemplate,
  isTemplateAllowed,
} from '@/lib/config/invoice-templates';
import { entitledPlan, findPlan } from '@/lib/config/plans';

/* ── Invoicing ────────────────────────────────────────────────────────────── */

export async function updateInvoicingAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const parsed = invoicingSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    await db.companySettings.upsert({
      where: { organizationId: organization.id },
      create: { organizationId: organization.id, ...data },
      update: data,
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: 'Updated invoicing and numbering settings',
    });

    revalidatePath('/settings/invoicing');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Invoice design ───────────────────────────────────────────────────────── */

/**
 * Choosing the printed design.
 *
 * Two checks, in this order: the id has to name a design, and the workspace's
 * plan has to include it. The second one is the point. The picker already
 * shows the designs above the plan as locked, but a locked card is a hint, not
 * a gate — the gate is here, where a hand-made request lands too.
 *
 * The plan asked for is the *entitled* plan, so a workspace on trial can pick a
 * Business design and keep it if it subscribes. If the trial lapses instead,
 * the choice stays on the row and the print route quietly falls back to the
 * default, rather than the save failing at somebody who chose it fairly.
 */
export async function updateInvoiceTemplateAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const parsed = invoiceTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Choose a design.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const { invoiceTemplate } = parsed.data;

    const row = await db.organization.findUniqueOrThrow({
      where: { id: organization.id },
      select: { plan: true, trialEndsAt: true, subscriptionStatus: true },
    });

    const plan = entitledPlan(row);
    if (!isTemplateAllowed(plan, invoiceTemplate)) {
      const design = findInvoiceTemplate(invoiceTemplate);
      return actionError(
        `${design?.name ?? 'That design'} comes with the ${
          findPlan(design?.plan)?.name ?? 'a higher'
        } plan. Upgrade and it is yours.`,
        'invoiceTemplate',
      );
    }

    await db.companySettings.upsert({
      where: { organizationId: organization.id },
      create: { organizationId: organization.id, invoiceTemplate },
      update: { invoiceTemplate },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: `Changed the invoice design to ${findInvoiceTemplate(invoiceTemplate)?.name ?? invoiceTemplate}`,
    });

    revalidatePath('/settings/invoice-design');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Tax ──────────────────────────────────────────────────────────────────── */

export async function updateTaxSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const parsed = taxSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    await db.companySettings.upsert({
      where: { organizationId: organization.id },
      create: { organizationId: organization.id, ...parsed.data },
      update: parsed.data,
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: 'Updated tax settings',
    });

    revalidatePath('/settings/tax');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Saving a tax rate.
 *
 * Marking one as the default clears the flag on the others in the same
 * transaction, because two defaults is not a state the rest of the app knows
 * how to read.
 */
export async function saveTaxRateAction(
  input: unknown,
  options?: { id?: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const parsed = taxRateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    if (options?.id) {
      const existing = await db.taxRate.findFirst({
        where: { id: options.id, organizationId: organization.id },
        select: { id: true },
      });
      if (!existing) return actionError('That rate no longer exists.');
    }

    const clash = await db.taxRate.findFirst({
      where: {
        organizationId: organization.id,
        name: data.name,
        ...(options?.id ? { NOT: { id: options.id } } : {}),
      },
      select: { id: true },
    });
    if (clash) return actionError('Another rate already uses that name.', 'name');

    const rate = await db.$transaction(async (tx) => {
      const saved = options?.id
        ? await tx.taxRate.update({
            where: { id: options.id },
            data,
            select: { id: true },
          })
        : await tx.taxRate.create({
            data: { organizationId: organization.id, ...data },
            select: { id: true },
          });

      if (data.isDefault) {
        await tx.taxRate.updateMany({
          where: { organizationId: organization.id, NOT: { id: saved.id } },
          data: { isDefault: false },
        });
      }

      return saved;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: options?.id ? 'update' : 'create',
      entityType: 'organization',
      entityId: organization.id,
      summary: `${options?.id ? 'Updated' : 'Added'} tax rate ${data.name}`,
    });

    revalidatePath('/settings/tax');
    return actionOk(rate);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteTaxRateAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const rate = await db.taxRate.findFirst({
      where: { id, organizationId: organization.id },
      select: { id: true, name: true },
    });
    if (!rate) return actionError('That rate no longer exists.');

    await db.taxRate.delete({ where: { id } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'organization',
      entityId: organization.id,
      summary: `Removed tax rate ${rate.name}`,
    });

    revalidatePath('/settings/tax');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Notifications ────────────────────────────────────────────────────────── */

export async function updateNotificationSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('settings.edit');

    const parsed = notificationSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Check the details.');
    }

    await db.companySettings.upsert({
      where: { organizationId: organization.id },
      create: { organizationId: organization.id, ...parsed.data },
      update: parsed.data,
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: 'Updated notification settings',
    });

    revalidatePath('/settings/notifications');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Your own profile ─────────────────────────────────────────────────────── */

/**
 * The signed-in user's own details.
 *
 * Deliberately not behind `settings.edit`: this is your own name and phone
 * number, and someone with no settings permission at all still owns those.
 */
export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return actionError('Sign in again to change your details.');

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? 'Check the details.',
      parsed.error.issues[0]?.path.join('.'),
    );
  }
  const data = parsed.data;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      jobTitle: data.jobTitle || null,
    },
  });

  revalidatePath('/settings/profile');
  revalidatePath('/', 'layout');
  return actionOk();
}

/**
 * Changing your own password.
 *
 * The current one has to be given and is checked against the stored hash, so
 * an unattended session cannot be used to lock the real owner out.
 */
export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return actionError('Sign in again to change your password.');

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? 'Check the details.',
      parsed.error.issues[0]?.path.join('.'),
    );
  }
  const data = parsed.data;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    return actionError('This account signs in another way, so it has no password.');
  }

  const valid = await compare(data.currentPassword, user.passwordHash);
  if (!valid) {
    return actionError('That is not your current password.', 'currentPassword');
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(data.password, 12) },
  });

  // Any outstanding reset link was issued against the old password and must
  // not survive a deliberate change.
  await db.verificationToken.updateMany({
    where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
    data: { usedAt: new Date() },
  });

  revalidatePath('/settings/profile');
  return actionOk();
}

/* ── People in the workspace ──────────────────────────────────────────────── */

/** A role id is only honoured once it is proved to belong to this workspace. */
async function roleInOrganization(organizationId: string, roleId: string) {
  return db.role.findFirst({
    where: { id: roleId, organizationId },
    select: { id: true, key: true, name: true },
  });
}

/** A membership id likewise. */
async function memberInOrganization(organizationId: string, memberId: string) {
  return db.organizationMember.findFirst({
    where: { id: memberId, organizationId, deletedAt: null },
    select: {
      id: true,
      userId: true,
      isOwner: true,
      status: true,
      joinedAt: true,
      user: { select: { name: true, email: true } },
    },
  });
}

/**
 * Emails someone that they have been added, and for a brand new account writes
 * the one-time record behind the set-a-password link.
 *
 * Kept separate so re-sending is the same code path as the first send, and so
 * an email provider outage cannot roll back a membership that was created
 * correctly. The person is in the workspace either way; what fails is the
 * message, and the caller says so.
 */
async function sendInvitation(input: {
  userId: string;
  name: string;
  email: string;
  invitedBy: string;
  organizationName: string;
  roleName: string;
  existingAccount: boolean;
}): Promise<boolean> {
  let url = absoluteUrl('/login');

  if (!input.existingAccount) {
    const token = createToken();

    await db.verificationToken.updateMany({
      where: { userId: input.userId, type: 'INVITATION', usedAt: null },
      data: { usedAt: new Date() },
    });

    await db.verificationToken.create({
      data: {
        token: token.hash,
        type: 'INVITATION',
        identifier: input.email,
        userId: input.userId,
        expiresAt: expiryFor('INVITATION'),
      },
    });

    url = absoluteUrl(`/accept-invite?token=${token.raw}`);
  }

  try {
    await sendMail(
      teamInviteEmail({
        to: input.email,
        name: input.name,
        invitedBy: input.invitedBy,
        organizationName: input.organizationName,
        roleName: input.roleName,
        url,
        existingAccount: input.existingAccount,
        expiresInHours: Math.round(TOKEN_TTL_MINUTES.INVITATION / 60),
      }),
    );
    return true;
  } catch (error) {
    console.error('Invitation email could not be sent', error);
    return false;
  }
}

/**
 * Adding someone to the workspace.
 *
 * An address already known to Adwuma360 keeps its account and password and
 * joins straight away: being invited to a second workspace must not reset the
 * first one, and the address is already proven. A new address gets an account
 * with no usable password, and stays `INVITED` until the emailed link sets one.
 */
export async function inviteMemberAction(
  input: unknown,
): Promise<ActionResult<{ emailed: boolean; joinedImmediately: boolean }>> {
  try {
    const context = await requirePermission('users.create');
    const { organization, user } = context;

    const parsed = inviteMemberSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const role = await roleInOrganization(organization.id, data.roleId);
    if (!role) return actionError('Choose a role from the list.', 'roleId');
    if (role.key === 'owner') {
      return actionError('The owner role cannot be handed out by invitation.', 'roleId');
    }

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true },
    });

    if (existingUser) {
      const already = await db.organizationMember.findFirst({
        where: { organizationId: organization.id, userId: existingUser.id },
        select: { id: true, deletedAt: true },
      });

      if (already && !already.deletedAt) {
        return actionError('That person is already in this workspace.', 'email');
      }

      const membership = {
        roleId: role.id,
        status: 'ACTIVE' as const,
        invitedAt: new Date(),
        joinedAt: new Date(),
      };

      if (already) {
        // Re-adding someone who was removed reuses their membership row so the
        // records already pointing at it stay attached to the same person.
        await db.organizationMember.update({
          where: { id: already.id },
          data: { ...membership, deletedAt: null },
        });
      } else {
        await db.organizationMember.create({
          data: { organizationId: organization.id, userId: existingUser.id, ...membership },
        });
      }

      if (data.jobTitle) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { jobTitle: data.jobTitle },
        });
      }

      const emailed = await sendInvitation({
        userId: existingUser.id,
        name: existingUser.name,
        email: data.email,
        invitedBy: user.name,
        organizationName: organization.name,
        roleName: role.name,
        existingAccount: true,
      });

      await logActivity({
        organizationId: organization.id,
        userId: user.id,
        action: 'create',
        entityType: 'user',
        entityId: existingUser.id,
        summary: `Added ${data.email} as ${role.name}`,
      });

      revalidatePath('/settings/users');
      return actionOk({ emailed, joinedImmediately: true });
    }

    // A password nobody holds. The invitation link is the only way in, and the
    // column is not nullable, so it gets a value that cannot be guessed rather
    // than an empty string that could be.
    const placeholder = await hash(createToken().raw, 12);

    const created = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        jobTitle: data.jobTitle || null,
        passwordHash: placeholder,
        memberships: {
          create: {
            organizationId: organization.id,
            roleId: role.id,
            status: 'INVITED',
            invitedAt: new Date(),
          },
        },
      },
      select: { id: true },
    });

    const emailed = await sendInvitation({
      userId: created.id,
      name: data.name,
      email: data.email,
      invitedBy: user.name,
      organizationName: organization.name,
      roleName: role.name,
      existingAccount: false,
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'user',
      entityId: created.id,
      summary: `Invited ${data.email} as ${role.name}`,
    });

    revalidatePath('/settings/users');
    return actionOk({ emailed, joinedImmediately: false });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function resendInviteAction(
  memberId: string,
): Promise<ActionResult<{ emailed: boolean }>> {
  try {
    const { organization, user } = await requirePermission('users.create');

    const member = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId: organization.id, deletedAt: null },
      select: {
        status: true,
        userId: true,
        role: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!member) return actionError('That person is no longer in this workspace.');
    if (member.status !== 'INVITED') {
      return actionError('They have already accepted, so there is nothing to resend.');
    }

    const emailed = await sendInvitation({
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      invitedBy: user.name,
      organizationName: organization.name,
      roleName: member.role.name,
      existingAccount: false,
    });

    return actionOk({ emailed });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Changing what someone can do.
 *
 * An owner's role is fixed and nobody can change their own: both would let a
 * workspace be left with no one able to restore access.
 */
export async function updateMemberRoleAction(input: unknown): Promise<ActionResult> {
  try {
    const context = await requirePermission('users.edit');
    const { organization, user } = context;

    const parsed = memberRoleSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Check the details.');
    }

    const member = await memberInOrganization(organization.id, parsed.data.memberId);
    if (!member) return actionError('That person is no longer in this workspace.');
    if (member.isOwner) return actionError('The owner keeps full access by definition.');
    if (member.userId === user.id) {
      return actionError('You cannot change your own role. Ask another administrator.');
    }

    const role = await roleInOrganization(organization.id, parsed.data.roleId);
    if (!role) return actionError('Choose a role from the list.', 'roleId');
    if (role.key === 'owner') {
      return actionError('Ownership is transferred separately, not assigned as a role.');
    }

    await db.organizationMember.update({
      where: { id: member.id },
      data: { roleId: role.id },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'user',
      entityId: member.userId,
      summary: `Changed ${member.user.name} to ${role.name}`,
    });

    revalidatePath('/settings/users');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Suspending keeps the history and takes away the access. */
export async function setMemberStatusAction(
  memberId: string,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('users.edit');

    const member = await memberInOrganization(organization.id, memberId);
    if (!member) return actionError('That person is no longer in this workspace.');
    if (member.isOwner) return actionError('The owner cannot be suspended.');
    if (member.userId === user.id) return actionError('You cannot suspend yourself.');

    await db.organizationMember.update({
      where: { id: member.id },
      data: {
        status,
        // Restoring someone who never finished the invitation still has no
        // join date; accepting the invitation is what sets it.
        ...(status === 'ACTIVE' && !member.joinedAt && member.status === 'SUSPENDED'
          ? { joinedAt: new Date() }
          : {}),
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'user',
      entityId: member.userId,
      summary: `${status === 'ACTIVE' ? 'Restored' : 'Suspended'} ${member.user.name}`,
    });

    revalidatePath('/settings/users');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Removing someone.
 *
 * Soft, because their name is on invoices, payslips and timesheets that must
 * keep reading correctly. The membership stops resolving, so they lose the
 * workspace immediately.
 */
export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('users.delete');

    const member = await memberInOrganization(organization.id, memberId);
    if (!member) return actionError('That person is no longer in this workspace.');
    if (member.isOwner) return actionError('The owner cannot be removed.');
    if (member.userId === user.id) {
      return actionError('You cannot remove yourself from the workspace.');
    }

    await db.organizationMember.update({
      where: { id: member.id },
      data: { deletedAt: new Date(), status: 'SUSPENDED' },
    });

    await db.verificationToken.updateMany({
      where: { userId: member.userId, type: 'INVITATION', usedAt: null },
      data: { usedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'user',
      entityId: member.userId,
      summary: `Removed ${member.user.name} from the workspace`,
    });

    revalidatePath('/settings/users');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Roles ────────────────────────────────────────────────────────────────── */

/** A role key that is stable, readable and unique inside the workspace. */
async function uniqueRoleKey(organizationId: string, name: string) {
  const base = slugify(name).slice(0, 40) || 'role';
  let key = base;
  let suffix = 2;

  while (
    await db.role.findFirst({
      where: { organizationId, key },
      select: { id: true },
    })
  ) {
    key = `${base}-${suffix}`;
    suffix += 1;
  }

  return key;
}

/**
 * Saving a role and its permission matrix.
 *
 * Permission keys are resolved against the catalogue, so anything the form did
 * not get from this app is dropped rather than stored as a grant nothing can
 * check. The owner role is left alone: it is what an locked-out workspace is
 * recovered with.
 */
export async function saveRoleAction(
  input: unknown,
  options?: { id?: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission(
      options?.id ? 'users.edit' : 'users.create',
    );

    const parsed = roleSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    let existing: { id: string; key: string } | null = null;
    if (options?.id) {
      existing = await roleInOrganization(organization.id, options.id);
      if (!existing) return actionError('That role no longer exists.');
      if (existing.key === 'owner') {
        return actionError('The owner role is fixed so a workspace can always be recovered.');
      }
    }

    const clash = await db.role.findFirst({
      where: {
        organizationId: organization.id,
        name: data.name,
        ...(existing ? { NOT: { id: existing.id } } : {}),
      },
      select: { id: true },
    });
    if (clash) return actionError('Another role already uses that name.', 'name');

    const permissions = await db.permission.findMany({
      where: { key: { in: data.permissions } },
      select: { id: true },
    });

    const role = await db.$transaction(async (tx) => {
      const saved = existing
        ? await tx.role.update({
            where: { id: existing.id },
            data: { name: data.name, description: data.description || null },
            select: { id: true },
          })
        : await tx.role.create({
            data: {
              organizationId: organization.id,
              key: await uniqueRoleKey(organization.id, data.name),
              name: data.name,
              description: data.description || null,
              isSystem: false,
            },
            select: { id: true },
          });

      await tx.rolePermission.deleteMany({ where: { roleId: saved.id } });
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: saved.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      return saved;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: existing ? 'update' : 'create',
      entityType: 'role',
      entityId: role.id,
      summary: `${existing ? 'Updated' : 'Created'} the ${data.name} role`,
    });

    revalidatePath('/settings/roles');
    revalidatePath('/settings/users');
    return actionOk(role);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteRoleAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('users.delete');

    const role = await db.role.findFirst({
      where: { id, organizationId: organization.id },
      select: {
        id: true,
        name: true,
        isSystem: true,
        _count: { select: { members: { where: { deletedAt: null } } } },
      },
    });
    if (!role) return actionError('That role no longer exists.');
    if (role.isSystem) {
      return actionError('Built-in roles stay. Adjust its permissions instead.');
    }
    if (role._count.members > 0) {
      return actionError(
        `${role._count.members} ${
          role._count.members === 1 ? 'person still has' : 'people still have'
        } this role. Move them first.`,
      );
    }

    await db.role.delete({ where: { id: role.id } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'role',
      entityId: role.id,
      summary: `Deleted the ${role.name} role`,
    });

    revalidatePath('/settings/roles');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

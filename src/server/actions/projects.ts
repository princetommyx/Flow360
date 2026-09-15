'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';
import { projectSchema, taskSchema, timesheetSchema } from '@/lib/validations/project';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import type { TaskStatus } from '@/generated/prisma/enums';

/* ── Projects ─────────────────────────────────────────────────────────────── */

export async function createProjectAction(
  input: unknown,
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const { organization, user } = await requirePermission('projects.create');

    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const clash = await db.project.findFirst({
      where: { organizationId: organization.id, code: data.code },
      select: { id: true },
    });
    if (clash) return actionError('Another project already uses that code.', 'code');

    // A customer id from the form is only honoured if it belongs here.
    const customerId = data.customerId
      ? (
          await db.customer.findFirst({
            where: {
              id: data.customerId,
              organizationId: organization.id,
              deletedAt: null,
            },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    const project = await db.project.create({
      data: {
        organizationId: organization.id,
        customerId,
        code: data.code,
        name: data.name,
        description: data.description || null,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget,
        currency: organization.currency,
        progress: data.progress,
      },
      select: { id: true, code: true },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'project',
      entityId: project.id,
      summary: `Opened project ${project.code} — ${data.name}`,
    });

    revalidatePath('/projects');
    return actionOk(project);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateProjectAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('projects.edit');

    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.project.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, code: true },
    });
    if (!existing) return actionError('That project no longer exists.');

    const clash = await db.project.findFirst({
      where: { organizationId: organization.id, code: data.code, NOT: { id } },
      select: { id: true },
    });
    if (clash) return actionError('Another project already uses that code.', 'code');

    const customerId = data.customerId
      ? (
          await db.customer.findFirst({
            where: {
              id: data.customerId,
              organizationId: organization.id,
              deletedAt: null,
            },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    await db.project.update({
      where: { id },
      data: {
        customerId,
        code: data.code,
        name: data.name,
        description: data.description || null,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget,
        progress: data.progress,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'project',
      entityId: id,
      summary: `Updated project ${data.code}`,
    });

    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('projects.delete');

    const project = await db.project.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        code: true,
        _count: { select: { timesheets: true, invoices: true } },
      },
    });
    if (!project) return actionError('That project no longer exists.');

    if (project._count.invoices > 0) {
      return actionError(
        'This project has been invoiced, so it cannot be deleted. Mark it completed or cancelled instead.',
      );
    }
    if (project._count.timesheets > 0) {
      return actionError(
        'Hours have been booked against this project. Mark it cancelled instead, so the time worked stays on the record.',
      );
    }

    await db.project.update({ where: { id }, data: { deletedAt: new Date() } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'project',
      entityId: id,
      summary: `Deleted project ${project.code}`,
    });

    revalidatePath('/projects');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Team ─────────────────────────────────────────────────────────────────── */

export async function addProjectMemberAction(input: {
  projectId: string;
  employeeId: string;
  role: string;
  hourlyRate: number | null;
}): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('projects.edit');

    const [project, employee] = await Promise.all([
      db.project.findFirst({
        where: { id: input.projectId, organizationId: organization.id, deletedAt: null },
        select: { id: true, code: true },
      }),
      db.employee.findFirst({
        where: {
          id: input.employeeId,
          organizationId: organization.id,
          deletedAt: null,
        },
        select: { id: true, firstName: true, lastName: true, baseSalary: true },
      }),
    ]);
    if (!project) return actionError('That project no longer exists.');
    if (!employee) return actionError('That person is not on your team.');

    const already = await db.projectMember.findFirst({
      where: { projectId: project.id, employeeId: employee.id },
      select: { id: true },
    });
    if (already) return actionError('They are already on this project.');

    await db.projectMember.create({
      data: {
        projectId: project.id,
        employeeId: employee.id,
        role: input.role?.trim() || 'Contributor',
        hourlyRate: input.hourlyRate,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'project',
      entityId: project.id,
      summary: `Added ${employee.firstName} ${employee.lastName} to ${project.code}`,
    });

    revalidatePath(`/projects/${project.id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function removeProjectMemberAction(
  memberId: string,
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('projects.edit');

    const member = await db.projectMember.findFirst({
      where: { id: memberId, project: { organizationId: organization.id } },
      select: {
        id: true,
        projectId: true,
        employee: { select: { firstName: true, lastName: true } },
        project: { select: { code: true } },
      },
    });
    if (!member) return actionError('They are not on this project.');

    await db.projectMember.delete({ where: { id: memberId } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'project',
      entityId: member.projectId,
      summary: `Removed ${member.employee.firstName} ${member.employee.lastName} from ${member.project.code}`,
    });

    revalidatePath(`/projects/${member.projectId}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Tasks ────────────────────────────────────────────────────────────────── */

async function ownedProject(organizationId: string, projectId: string | null | undefined) {
  if (!projectId) return null;
  return db.project.findFirst({
    where: { id: projectId, organizationId, deletedAt: null },
    select: { id: true, code: true },
  });
}

async function ownedAssignee(organizationId: string, userId: string | null | undefined) {
  if (!userId) return null;
  const membership = await db.organizationMember.findFirst({
    where: { organizationId, userId, status: 'ACTIVE' },
    select: { userId: true },
  });
  return membership?.userId ?? null;
}

export async function createTaskAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('tasks.create');

    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const project = await ownedProject(organization.id, data.projectId);
    if (data.projectId && !project) {
      return actionError('That project no longer exists.', 'projectId');
    }

    const assigneeId = await ownedAssignee(organization.id, data.assigneeId);
    if (data.assigneeId && !assigneeId) {
      return actionError('That person is not in this workspace.', 'assigneeId');
    }

    // New work goes to the top of its column, where someone will see it.
    const first = await db.task.findFirst({
      where: { organizationId: organization.id, status: data.status, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { sortOrder: true },
    });

    const task = await db.task.create({
      data: {
        organizationId: organization.id,
        projectId: project?.id ?? null,
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completedAt: data.status === 'DONE' ? new Date() : null,
        estimatedHours: data.estimatedHours ?? null,
        sortOrder: (first?.sortOrder ?? 0) - 1,
      },
      select: { id: true },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'task',
      entityId: task.id,
      summary: `Added task — ${data.title}`,
    });

    revalidatePath('/tasks');
    if (project) revalidatePath(`/projects/${project.id}`);
    return actionOk(task);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateTaskAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('tasks.edit');

    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.task.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, status: true, completedAt: true },
    });
    if (!existing) return actionError('That task no longer exists.');

    const project = await ownedProject(organization.id, data.projectId);
    if (data.projectId && !project) {
      return actionError('That project no longer exists.', 'projectId');
    }

    const assigneeId = await ownedAssignee(organization.id, data.assigneeId);
    if (data.assigneeId && !assigneeId) {
      return actionError('That person is not in this workspace.', 'assigneeId');
    }

    await db.task.update({
      where: { id },
      data: {
        projectId: project?.id ?? null,
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        // Keep the original completion time if it was already done, so moving
        // a card back and forth does not rewrite when the work finished.
        completedAt:
          data.status === 'DONE' ? (existing.completedAt ?? new Date()) : null,
        estimatedHours: data.estimatedHours ?? null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'task',
      entityId: id,
      summary: `Updated task — ${data.title}`,
    });

    revalidatePath('/tasks');
    if (project) revalidatePath(`/projects/${project.id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Moving a card between columns, which is the common edit by far. */
export async function setTaskStatusAction(
  id: string,
  status: TaskStatus,
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('tasks.edit');

    const task = await db.task.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, title: true, projectId: true, completedAt: true },
    });
    if (!task) return actionError('That task no longer exists.');

    await db.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'DONE' ? (task.completedAt ?? new Date()) : null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'task',
      entityId: id,
      summary: `Moved "${task.title}" to ${status.toLowerCase().replace(/_/g, ' ')}`,
    });

    revalidatePath('/tasks');
    if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('tasks.delete');

    const task = await db.task.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, title: true, projectId: true },
    });
    if (!task) return actionError('That task no longer exists.');

    await db.task.update({ where: { id }, data: { deletedAt: new Date() } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'task',
      entityId: id,
      summary: `Deleted task — ${task.title}`,
    });

    revalidatePath('/tasks');
    if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/* ── Timesheets ───────────────────────────────────────────────────────────── */

/**
 * Recomputes what a project has cost in labour.
 *
 * `spent` is derived from the hours booked against it rather than typed, so
 * budget-versus-actual cannot quietly stop being true. Only billable hours
 * with a rate count: unpaid internal time is real work but not a cost anyone
 * is being charged for.
 */
async function recalculateSpend(projectId: string) {
  const entries = await db.timesheet.findMany({
    where: { projectId, billable: true, hourlyRate: { not: null } },
    select: { hours: true, hourlyRate: true },
  });

  const spent = round(
    entries.reduce(
      (total, entry) => total + toNumber(entry.hours) * toNumber(entry.hourlyRate),
      0,
    ),
  );

  await db.project.update({ where: { id: projectId }, data: { spent } });
  return spent;
}

export async function saveTimesheetAction(
  input: unknown,
  options?: { id?: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('timesheets.create');

    const parsed = timesheetSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the entry.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const project = await ownedProject(organization.id, data.projectId);
    if (!project) return actionError('That project no longer exists.', 'projectId');

    if (data.taskId) {
      const task = await db.task.findFirst({
        where: {
          id: data.taskId,
          organizationId: organization.id,
          projectId: project.id,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!task) return actionError('That task is not on this project.', 'taskId');
    }

    if (data.employeeId) {
      const employee = await db.employee.findFirst({
        where: {
          id: data.employeeId,
          organizationId: organization.id,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!employee) return actionError('That person is not on your team.', 'employeeId');
    }

    const values = {
      organizationId: organization.id,
      projectId: project.id,
      taskId: data.taskId || null,
      employeeId: data.employeeId || null,
      userId: user.id,
      date: new Date(data.date),
      hours: data.hours,
      description: data.description || null,
      billable: data.billable,
      hourlyRate: data.hourlyRate ?? null,
    };

    const entry = options?.id
      ? await db.timesheet.update({
          where: { id: options.id },
          data: values,
          select: { id: true },
        })
      : await db.timesheet.create({ data: values, select: { id: true } });

    await recalculateSpend(project.id);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: options?.id ? 'update' : 'create',
      entityType: 'timesheet',
      entityId: entry.id,
      summary: `${options?.id ? 'Updated' : 'Logged'} ${data.hours}h on ${project.code}`,
    });

    revalidatePath('/timesheets');
    revalidatePath('/projects');
    revalidatePath(`/projects/${project.id}`);
    return actionOk(entry);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteTimesheetAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('timesheets.delete');

    const entry = await db.timesheet.findFirst({
      where: { id, organizationId: organization.id },
      select: { id: true, projectId: true, hours: true },
    });
    if (!entry) return actionError('That entry no longer exists.');

    await db.timesheet.delete({ where: { id } });
    await recalculateSpend(entry.projectId);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'timesheet',
      entityId: id,
      summary: `Removed a timesheet entry of ${toNumber(entry.hours)}h`,
    });

    revalidatePath('/timesheets');
    revalidatePath('/projects');
    revalidatePath(`/projects/${entry.projectId}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

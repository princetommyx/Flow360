import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { CountUp } from '@/components/shared/count-up';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { toNumber } from '@/lib/money';
import { requirePermission } from '@/server/tenant';
import { projectOptions } from '@/server/services/projects';

import { TaskBoard, type BoardTask } from './task-board';

export const metadata: Metadata = { title: 'Tasks' };

export default async function TasksPage() {
  const context = await requirePermission('tasks.view');
  const now = new Date();

  const [tasks, projects, members] = await Promise.all([
    db.task.findMany({
      where: { organizationId: context.organization.id, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 500,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        estimatedHours: true,
        projectId: true,
        assigneeId: true,
        project: { select: { code: true } },
        assignee: { select: { name: true } },
      },
    }),
    projectOptions(context.organization.id),
    db.organizationMember.findMany({
      where: { organizationId: context.organization.id, status: 'ACTIVE' },
      select: { user: { select: { id: true, name: true } } },
      take: 200,
    }),
  ]);

  const rows: BoardTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours ? toNumber(task.estimatedHours) : null,
    projectId: task.projectId,
    projectCode: task.project?.code ?? null,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.name ?? null,
    isOverdue: Boolean(task.dueDate) && task.dueDate! < now && task.status !== 'DONE',
  }));

  const can = {
    create: hasPermission(context.permissions, 'tasks.create'),
    edit: hasPermission(context.permissions, 'tasks.edit'),
    delete: hasPermission(context.permissions, 'tasks.delete'),
  };

  const open = rows.filter((task) => task.status !== 'DONE');
  const overdue = rows.filter((task) => task.isOverdue);
  const blocked = rows.filter((task) => task.status === 'BLOCKED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="What is being worked on, what is stuck, and what is nearly done."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Still open</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={open.length} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            of {rows.length} on the board
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Overdue</p>
          <p
            className={
              overdue.length > 0
                ? 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-destructive'
                : 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular'
            }
          >
            <CountUp value={overdue.length} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {overdue.length === 0 ? 'Nothing past its date' : 'Past their due date'}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Blocked</p>
          <p
            className={
              blocked.length > 0
                ? 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-warning-foreground'
                : 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular'
            }
          >
            <CountUp value={blocked.length} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {blocked.length === 0 ? 'Nothing waiting on anyone' : 'Waiting on something'}
          </p>
        </Card>
      </div>

      <TaskBoard
        tasks={rows}
        can={can}
        choices={{
          projects,
          people: members.map((member) => ({
            id: member.user.id,
            name: member.user.name,
          })),
        }}
      />
    </div>
  );
}

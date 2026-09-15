import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DetailList } from '@/components/shared/detail-list';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatNumber, round, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { getProject } from '@/server/services/projects';
import { employeeOptions } from '@/server/services/employees';

import { ProjectTeam } from './project-team';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('projects.view');

  const project = await getProject(context.organization.id, id);
  if (!project) notFound();

  const canEdit = hasPermission(context.permissions, 'projects.edit');
  const employees = canEdit ? await employeeOptions(context.organization.id) : [];

  const currency = project.currency;
  const budget = toNumber(project.budget);
  const spent = toNumber(project.spent);
  const hours = round(
    project.timesheets.reduce((total, entry) => total + toNumber(entry.hours), 0),
  );
  const openTasks = project.tasks.filter((task) => task.status !== 'DONE');
  const overBudget = budget > 0 && spent > budget;
  const usedShare = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  const onTeam = new Set(project.members.map((member) => member.employee.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${project.code}${
          project.customer
            ? ` · ${project.customer.companyName ?? project.customer.name}`
            : ' · Internal'
        }`}
        meta={<StatusBadge status={project.status} />}
        actions={
          canEdit ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Budget</p>
          <p className="mt-2 text-xl font-semibold tabular">
            {formatCurrency(budget, { currency })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Spent</p>
          <p
            className={
              overBudget
                ? 'mt-2 text-xl font-semibold tabular text-destructive'
                : 'mt-2 text-xl font-semibold tabular'
            }
          >
            {formatCurrency(spent, { currency })}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className={
                overBudget
                  ? 'h-full rounded-full bg-destructive'
                  : 'h-full rounded-full bg-primary'
              }
              style={{ width: `${Math.max(2, usedShare)}%` }}
            />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Hours booked</p>
          <p className="mt-2 text-xl font-semibold tabular">{formatNumber(hours, 2)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Tasks open</p>
          <p className="mt-2 text-xl font-semibold tabular">
            {openTasks.length}
            <span className="text-[13px] font-normal text-muted-foreground">
              {' '}
              of {project.tasks.length}
            </span>
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Tasks</CardTitle>
              <CardDescription>
                <Link href="/tasks" className="text-primary hover:underline">
                  Manage them on the board
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.tasks.length === 0 ? (
                <p className="text-[13.5px] text-muted-foreground">
                  Nothing on this project yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {project.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {task.assignee?.name ?? 'Unassigned'}
                          {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {task.priority.toLowerCase()}
                        </Badge>
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Time booked</CardTitle>
              <CardDescription>The fifty most recent entries.</CardDescription>
            </CardHeader>
            <CardContent>
              {project.timesheets.length === 0 ? (
                <p className="text-[13.5px] text-muted-foreground">
                  No hours booked yet.{' '}
                  <Link href="/timesheets" className="text-primary hover:underline">
                    Log some
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {project.timesheets.map((entry) => {
                    const entryHours = toNumber(entry.hours);
                    const rate = entry.hourlyRate ? toNumber(entry.hourlyRate) : null;
                    return (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px]">
                            {entry.task?.title ?? entry.description ?? 'Project work'}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatDate(entry.date)}
                            {entry.employee
                              ? ` · ${entry.employee.firstName} ${entry.employee.lastName}`
                              : ''}
                            {!entry.billable ? ' · not billable' : ''}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-semibold tabular">
                            {formatNumber(entryHours, 2)} h
                          </p>
                          {entry.billable && rate ? (
                            <p className="text-[11.5px] tabular text-muted-foreground">
                              {formatCurrency(round(entryHours * rate), { currency })}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ProjectTeam
            projectId={project.id}
            currency={currency}
            canEdit={canEdit}
            members={project.members.map((member) => ({
              id: member.id,
              employeeId: member.employee.id,
              name: `${member.employee.firstName} ${member.employee.lastName}`,
              position: member.employee.position,
              role: member.role,
              hourlyRate: member.hourlyRate ? toNumber(member.hourlyRate) : null,
            }))}
            available={employees
              .filter((employee) => !onTeam.has(employee.id))
              .map((employee) => ({
                id: employee.id,
                name: employee.name,
              }))}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Code', value: project.code },
                  { label: 'Starts', value: formatDate(project.startDate) },
                  {
                    label: 'Due',
                    value: project.endDate ? formatDate(project.endDate) : 'Open-ended',
                  },
                  { label: 'Progress', value: `${project.progress}%` },
                  { label: 'Currency', value: project.currency },
                ]}
              />
              {project.customer ? (
                <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/customers/${project.customer.id}`}>View customer</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {project.description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Separator className="sr-only" />
    </div>
  );
}

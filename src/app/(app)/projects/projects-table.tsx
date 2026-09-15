'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteProjectAction } from '@/server/actions/projects';
import { formatCurrency, formatNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { ProjectListRow } from '@/server/services/projects';

export function ProjectsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  customers,
  can,
}: {
  rows: ProjectListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  customers: Array<{ id: string; label: string }>;
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const deleteConfirm = useConfirm<ProjectListRow>();

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    const result = await action();
    if (!result.ok) {
      toast.error(result.error ?? 'That did not work.');
      return;
    }
    toast.success(success);
    router.refresh();
  }

  const identity = (project: ProjectListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-muted-foreground">
          {project.code}
        </span>
        <span className="truncate text-[13.5px] font-medium">{project.name}</span>
        <StatusBadge status={project.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {project.customerName ?? 'Internal'}
        {project.totalTasks > 0
          ? ` · ${project.openTasks} of ${project.totalTasks} tasks open`
          : ''}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<ProjectListRow>> = [
    { id: 'name', header: 'Project', sortable: true, cell: identity },
    {
      id: 'endDate',
      header: 'Due',
      hideBelow: 'lg',
      cell: (project) =>
        project.endDate ? (
          <span
            className={
              project.isLate
                ? 'text-[13px] font-medium text-warning-foreground'
                : 'text-[13px] text-muted-foreground'
            }
          >
            {formatDate(project.endDate)}
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">Open-ended</span>
        ),
    },
    {
      id: 'hours',
      header: 'Hours',
      hideBelow: 'xl',
      optional: true,
      align: 'right',
      cell: (project) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {project.hours > 0 ? formatNumber(project.hours, 2) : '—'}
        </span>
      ),
    },
    {
      id: 'progress',
      header: 'Progress',
      sortable: true,
      hideBelow: 'md',
      cell: (project) => (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${project.progress}%` }}
            />
          </span>
          <span className="text-[12.5px] tabular text-muted-foreground">
            {project.progress}%
          </span>
        </div>
      ),
    },
    {
      id: 'budget',
      header: 'Budget',
      sortable: true,
      align: 'right',
      cell: (project) => {
        const over = project.budget > 0 && project.spent > project.budget;
        return (
          <div className="text-right">
            <p className="text-[13px] font-semibold tabular">
              {formatCurrency(project.budget, { currency })}
            </p>
            <p
              className={
                over
                  ? 'text-[11.5px] font-medium tabular text-destructive'
                  : 'text-[11.5px] tabular text-muted-foreground'
              }
            >
              {formatCurrency(project.spent, { currency })} spent
            </p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (project) => (
        <RowActions
          actions={[
            ...(can.edit
              ? [{ label: 'Edit', icon: Pencil, href: `/projects/${project.id}/edit` }]
              : []),
            ...(can.delete
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    separatorBefore: true,
                    onSelect: () => deleteConfirm.ask(project),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(project) => project.id}
        rowHref={(project) => `/projects/${project.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search name, code or customer…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            allLabel: 'All projects',
            options: [
              { value: 'open', label: 'Still running' },
              { value: 'PLANNING', label: 'Planning' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ON_HOLD', label: 'On hold' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'customerId',
            label: 'Customer',
            allLabel: 'All customers',
            options: customers.map((customer) => ({
              value: customer.id,
              label: customer.label,
            })),
          },
        ]}
        mobileRow={(project) => (
          <div className="flex items-start justify-between gap-3">
            {identity(project)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(project.budget, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {project.progress}% done
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Group work under a project and the tasks, hours and costs against it all add up in one place."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/projects/new">Open a project</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this project?"
        destructive
        confirmLabel="Delete project"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.name}</strong>{' '}
            and its tasks will be removed from your lists. This cannot be undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deleteProjectAction(deleteConfirm.target!.id),
                'Project deleted',
              )
            : undefined
        }
      />
    </>
  );
}

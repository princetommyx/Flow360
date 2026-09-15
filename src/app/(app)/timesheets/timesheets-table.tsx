'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteTimesheetAction } from '@/server/actions/projects';
import { formatCurrency, formatNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';

import {
  TimesheetDialog,
  type EditableEntry,
  type TimesheetChoices,
} from './timesheet-dialog';

export type TimesheetRow = EditableEntry & {
  projectCode: string;
  projectName: string;
  taskTitle: string | null;
  personName: string | null;
  value: number;
};

export function TimesheetsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  choices,
  can,
}: {
  rows: TimesheetRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  choices: TimesheetChoices;
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const deleteConfirm = useConfirm<TimesheetRow>();
  const [editing, setEditing] = React.useState<TimesheetRow | null>(null);
  const [open, setOpen] = React.useState(false);

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

  const identity = (row: TimesheetRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-muted-foreground">
          {row.projectCode}
        </span>
        <span className="truncate text-[13.5px] font-medium">
          {row.taskTitle ?? row.projectName}
        </span>
        {!row.billable ? (
          <Badge variant="outline" size="sm">
            Not billable
          </Badge>
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {row.personName ?? 'Nobody recorded'}
        {row.description ? ` · ${row.description}` : ''}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<TimesheetRow>> = [
    { id: 'project', header: 'Work', cell: identity },
    {
      id: 'date',
      header: 'Date',
      sortable: true,
      hideBelow: 'md',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">{formatDate(row.date)}</span>
      ),
    },
    {
      id: 'hourlyRate',
      header: 'Rate',
      hideBelow: 'xl',
      optional: true,
      align: 'right',
      cell: (row) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {row.hourlyRate ? formatCurrency(row.hourlyRate, { currency }) : '—'}
        </span>
      ),
    },
    {
      id: 'hours',
      header: 'Hours',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <div className="text-right">
          <p className="text-[13px] font-semibold tabular">
            {formatNumber(row.hours, 2)}
          </p>
          {row.value > 0 ? (
            <p className="text-[11.5px] tabular text-muted-foreground">
              {formatCurrency(row.value, { currency })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <RowActions
          actions={[
            ...(can.edit
              ? [
                  {
                    label: 'Edit',
                    icon: Pencil,
                    onSelect: () => {
                      setEditing(row);
                      setOpen(true);
                    },
                  },
                ]
              : []),
            ...(can.delete
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => deleteConfirm.ask(row),
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
        rowKey={(row) => row.id}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search project, task or note…"
        toolbarActions={
          can.create && choices.projects.length > 0 ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus /> Log time
            </Button>
          ) : undefined
        }
        filters={[
          {
            key: 'projectId',
            label: 'Project',
            allLabel: 'All projects',
            options: choices.projects.map((project) => ({
              value: project.id,
              label: `${project.code} · ${project.name}`,
            })),
          },
          {
            key: 'billable',
            label: 'Billing',
            allLabel: 'All time',
            options: [
              { value: 'yes', label: 'Billable' },
              { value: 'no', label: 'Not billable' },
            ],
          },
        ]}
        mobileRow={(row) => (
          <div className="flex items-start justify-between gap-3">
            {identity(row)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatNumber(row.hours, 2)} h
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {formatDate(row.date, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={Clock}
            title="No time logged yet"
            description={
              choices.projects.length === 0
                ? 'Hours are booked against a project, so open one first.'
                : 'Book hours against a project and its spend follows the work rather than a figure someone typed.'
            }
            action={
              can.create && choices.projects.length > 0 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  Log time
                </Button>
              ) : undefined
            }
          />
        }
      />

      <TimesheetDialog
        open={open}
        onOpenChange={setOpen}
        choices={choices}
        currency={currency}
        entry={editing}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this entry?"
        destructive
        confirmLabel="Delete entry"
        description={
          <>
            {deleteConfirm.target
              ? `${formatNumber(deleteConfirm.target.hours, 2)} hours on ${deleteConfirm.target.projectCode}`
              : 'This entry'}{' '}
            will be removed and the project&rsquo;s spend worked out again without it.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deleteTimesheetAction(deleteConfirm.target!.id),
                'Entry deleted',
              )
            : undefined
        }
      />
    </>
  );
}

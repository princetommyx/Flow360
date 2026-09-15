'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CircleDashed, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { runAction } from '@/lib/client-action';
import { setTaskStatusAction } from '@/server/actions/projects';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';

import { TaskDialog, type TaskChoices } from './task-dialog';

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  estimatedHours: number | null;
  projectId: string | null;
  projectCode: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  isOverdue: boolean;
};

const COLUMNS = [
  { id: 'TODO', label: 'To do' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'IN_REVIEW', label: 'In review' },
  { id: 'BLOCKED', label: 'Blocked' },
  { id: 'DONE', label: 'Done' },
] as const;

const PRIORITY_TONE: Record<string, string> = {
  URGENT: 'border-destructive/40 text-destructive',
  HIGH: 'border-warning/50 text-warning-foreground',
  MEDIUM: 'border-border text-muted-foreground',
  LOW: 'border-border text-muted-foreground',
};

/**
 * The task board.
 *
 * Columns rather than a list because the question people actually have is what
 * is stuck and what is nearly finished, which a status column answers at a
 * glance and a sorted table does not. Moving a card is a select rather than a
 * drag: it works the same on a phone, which is where most of this gets read.
 */
export function TaskBoard({
  tasks,
  choices,
  can,
}: {
  tasks: BoardTask[];
  choices: TaskChoices;
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<BoardTask | null>(null);
  const [open, setOpen] = React.useState(false);
  const [moving, setMoving] = React.useState<string | null>(null);

  async function move(task: BoardTask, status: string) {
    setMoving(task.id);
    try {
      const result = await runAction(() =>
        setTaskStatusAction(task.id, status as never),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } finally {
      setMoving(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          icon={CircleDashed}
          title="Nothing on the board"
          description="Add what needs doing. Tasks can stand alone or sit under a project, and hours booked against them roll up to its cost."
          action={
            can.create ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                Add a task
              </Button>
            ) : undefined
          }
        />
        <TaskDialog
          open={open}
          onOpenChange={setOpen}
          choices={choices}
          task={null}
          canDelete={can.delete}
        />
      </>
    );
  }

  return (
    <>
      {can.create ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus /> Add a task
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <section
              key={column.id}
              aria-label={column.label}
              className="rounded-xl border border-border bg-surface-subtle p-3"
            >
              <header className="mb-2.5 flex items-center justify-between px-1">
                <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {column.label}
                </h2>
                <span className="text-[12px] tabular text-muted-foreground">
                  {columnTasks.length}
                </span>
              </header>

              <ul className="space-y-2">
                {columnTasks.map((task) => (
                  <li key={task.id}>
                    <article
                      className={cn(
                        'rounded-lg border border-border bg-surface p-3 shadow-xs transition-opacity',
                        moving === task.id && 'opacity-50',
                      )}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          if (!can.edit) return;
                          setEditing(task);
                          setOpen(true);
                        }}
                      >
                        <p className="text-[13px] font-medium leading-snug">
                          {task.title}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            size="sm"
                            className={PRIORITY_TONE[task.priority] ?? ''}
                          >
                            {task.priority.toLowerCase()}
                          </Badge>
                          {task.projectCode ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {task.projectCode}
                            </span>
                          ) : null}
                        </p>
                        {task.assigneeName || task.dueDate ? (
                          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                            {task.assigneeName ? <span>{task.assigneeName}</span> : null}
                            {task.dueDate ? (
                              <span
                                className={
                                  task.isOverdue
                                    ? 'font-medium text-destructive'
                                    : undefined
                                }
                              >
                                {formatDate(task.dueDate, 'dd MMM')}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                      </button>

                      {can.edit ? (
                        <div className="mt-2.5 border-t border-border pt-2">
                          <label className="sr-only" htmlFor={`move-${task.id}`}>
                            Move &ldquo;{task.title}&rdquo;
                          </label>
                          <select
                            id={`move-${task.id}`}
                            value={task.status}
                            disabled={moving === task.id}
                            onChange={(event) => void move(task, event.target.value)}
                            className="w-full rounded-md border border-input bg-surface px-2 py-1 text-[12px] outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60"
                          >
                            {COLUMNS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </article>
                  </li>
                ))}

                {columnTasks.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                    Nothing here
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        choices={choices}
        task={editing}
        canDelete={can.delete}
      />
    </>
  );
}

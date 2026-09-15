'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from '@/server/actions/projects';
import { taskSchema, type TaskInput } from '@/lib/validations/project';
import { toDateInput } from '@/lib/date';

import type { BoardTask } from './task-board';

export type TaskChoices = {
  projects: Array<{ id: string; name: string; code: string }>;
  people: Array<{ id: string; name: string }>;
};

const STATUS_LABELS: Record<TaskInput['status'], string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const PRIORITY_LABELS: Record<TaskInput['priority'], string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const NONE = '__none__';

export function TaskDialog({
  open,
  onOpenChange,
  choices,
  task,
  canDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  choices: TaskChoices;
  task: BoardTask | null;
  canDelete: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Add a task'}</DialogTitle>
          <DialogDescription>
            Tasks can stand alone or sit under a project — hours booked against
            them roll up to what that project has cost.
          </DialogDescription>
        </DialogHeader>

        {/* Keyed on the card so each opens with its own figures rather than
            being reset out of the previous one's. */}
        {open ? (
          <TaskFields
            key={task?.id ?? 'new'}
            choices={choices}
            task={task}
            canDelete={canDelete}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskFields({
  choices,
  task,
  canDelete,
  onDone,
}: {
  choices: TaskChoices;
  task: BoardTask | null;
  canDelete: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      projectId: task?.projectId ?? null,
      assigneeId: task?.assigneeId ?? null,
      status: (task?.status as TaskInput['status']) ?? 'TODO',
      priority: (task?.priority as TaskInput['priority']) ?? 'MEDIUM',
      dueDate: task?.dueDate ? toDateInput(task.dueDate) : '',
      estimatedHours: task?.estimatedHours ?? null,
    },
  });

  async function submit(values: TaskInput) {
    setError(null);
    const result = await runAction(() =>
      task ? updateTaskAction(task.id, values) : createTaskAction(values),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof TaskInput, { message: result.error });
      }
      return;
    }

    toast.success(task ? 'Task updated' : 'Task added');
    onDone();
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="grid gap-4" noValidate>
        <FormStatus error={error} />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>What needs doing</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Fit the second-floor ducting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(value) =>
                    form.setValue('projectId', value === NONE ? null : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>No project</SelectItem>
                    {choices.projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.code} — {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned to</FormLabel>
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(value) =>
                    form.setValue('assigneeId', value === NONE ? null : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>Nobody yet</SelectItem>
                    {choices.people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Status</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    form.setValue('status', value as TaskInput['status'], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Priority</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    form.setValue('priority', value as TaskInput['priority'], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimate (hours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.25"
                    className="tabular"
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === '' ? null : Number(event.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Detail, links, anything useful." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="sm:justify-between">
          {task && canDelete ? (
            <Button
              type="button"
              variant="ghost"
              loading={removing}
              className="text-muted-foreground hover:text-destructive"
              onClick={async () => {
                setRemoving(true);
                try {
                  const result = await runAction(() => deleteTaskAction(task.id));
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success('Task deleted');
                  onDone();
                  router.refresh();
                } finally {
                  setRemoving(false);
                }
              }}
            >
              <Trash2 /> Delete
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {task ? 'Save changes' : 'Add task'}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

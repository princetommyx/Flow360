'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  FormDescription,
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
import { saveTimesheetAction } from '@/server/actions/projects';
import { timesheetSchema, type TimesheetInput } from '@/lib/validations/project';
import { formatCurrency } from '@/lib/money';
import { toDateInput } from '@/lib/date';

export type TimesheetChoices = {
  projects: Array<{ id: string; name: string; code: string }>;
  employees: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; projectId: string | null }>;
};

export type EditableEntry = {
  id: string;
  projectId: string;
  taskId: string | null;
  employeeId: string | null;
  date: Date;
  hours: number;
  description: string | null;
  billable: boolean;
  hourlyRate: number | null;
};

const NONE = '__none__';

export function TimesheetDialog({
  open,
  onOpenChange,
  choices,
  entry,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  choices: TimesheetChoices;
  entry: EditableEntry | null;
  currency: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit time entry' : 'Log time'}</DialogTitle>
          <DialogDescription>
            Billable hours with a rate are what a project&rsquo;s spend is worked
            out from, so its cost follows the work rather than being typed in.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <TimesheetFields
            key={entry?.id ?? 'new'}
            choices={choices}
            entry={entry}
            currency={currency}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TimesheetFields({
  choices,
  entry,
  currency,
  onDone,
}: {
  choices: TimesheetChoices;
  entry: EditableEntry | null;
  currency: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<TimesheetInput>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      projectId: entry?.projectId ?? choices.projects[0]?.id ?? '',
      taskId: entry?.taskId ?? null,
      employeeId: entry?.employeeId ?? null,
      date: entry ? toDateInput(entry.date) : toDateInput(new Date()),
      hours: entry?.hours ?? 1,
      description: entry?.description ?? '',
      billable: entry?.billable ?? true,
      hourlyRate: entry?.hourlyRate ?? null,
    },
  });

  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const billable = useWatch({ control: form.control, name: 'billable' });
  const hours = useWatch({ control: form.control, name: 'hours' });
  const rate = useWatch({ control: form.control, name: 'hourlyRate' });

  // Only this project's tasks, so an entry cannot be booked against work on
  // another job.
  const tasks = choices.tasks.filter((task) => task.projectId === projectId);

  async function submit(values: TimesheetInput) {
    setError(null);
    const result = await runAction(() =>
      saveTimesheetAction(values, entry ? { id: entry.id } : undefined),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof TimesheetInput, { message: result.error });
      }
      return;
    }

    toast.success(entry ? 'Entry updated' : 'Time logged');
    onDone();
    router.refresh();
  }

  const value = billable && rate ? (Number(hours) || 0) * Number(rate) : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="grid gap-4" noValidate>
        <FormStatus error={error} />

        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Project</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={(next) => {
                  form.setValue('projectId', next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  // The task belonged to the old project, so it cannot stand.
                  form.setValue('taskId', null, { shouldDirty: true });
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {choices.projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} · {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="taskId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task</FormLabel>
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(next) =>
                    form.setValue('taskId', next === NONE ? null : next, {
                      shouldDirty: true,
                    })
                  }
                  disabled={tasks.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>General project work</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
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
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who did it</FormLabel>
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(next) =>
                    form.setValue('employeeId', next === NONE ? null : next, {
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
                    <SelectItem value={NONE}>Not recorded</SelectItem>
                    {choices.employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.25"
                    className="tabular"
                    name={field.name}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === '' ? 0 : Number(event.target.value),
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
          name="billable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    form.setValue('billable', checked === true, { shouldDirty: true })
                  }
                />
              </FormControl>
              <div>
                <FormLabel className="cursor-pointer">Billable</FormLabel>
                <FormDescription>
                  Unbillable time is still recorded. It just does not add to the
                  project&rsquo;s cost.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {billable ? (
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly rate</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
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
                <FormDescription>
                  {value > 0
                    ? `Adds ${formatCurrency(value, { currency })} to the project's spend.`
                    : 'Leave empty if this time is not being charged out.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What was done</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Short note for the record." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={form.formState.isSubmitting}>
            {entry ? 'Save changes' : 'Log it'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

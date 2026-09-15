'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
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
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { runAction } from '@/lib/client-action';
import {
  createProjectAction,
  updateProjectAction,
} from '@/server/actions/projects';
import { projectSchema, type ProjectInput } from '@/lib/validations/project';
import { toDateInput } from '@/lib/date';

const STATUS_LABELS: Record<ProjectInput['status'], string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function ProjectForm({
  projectId,
  defaultValues,
  customers,
  currency,
  suggestedCode,
}: {
  projectId?: string;
  defaultValues?: Partial<ProjectInput>;
  customers: Array<{ id: string; label: string }>;
  currency: string;
  suggestedCode?: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [today] = React.useState(() => toDateInput(new Date()));

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: suggestedCode ?? '',
      customerId: null,
      description: '',
      status: 'PLANNING',
      startDate: today,
      endDate: '',
      budget: 0,
      progress: 0,
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const progress = useWatch({ control: form.control, name: 'progress' }) ?? 0;

  /** A new project's code follows its name until someone types their own. */
  const [codeTouched, setCodeTouched] = React.useState(Boolean(projectId));

  async function submit(values: ProjectInput) {
    setError(null);
    const result = await runAction(() =>
      projectId ? updateProjectAction(projectId, values) : createProjectAction(values),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof ProjectInput, { message: result.error });
      }
      return;
    }

    toast.success(projectId ? 'Project updated' : `${values.name} opened`);
    router.push(`/projects/${result.data.id}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">The work</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Project name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Harbour fitout, phase two"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        if (codeTouched) return;
                        const derived = event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                          .split('-')[0]
                          ?.slice(0, 12);
                        if (derived) {
                          form.setValue('code', derived, { shouldValidate: true });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Short code</FormLabel>
                  <FormControl>
                    <Input
                      className="font-mono uppercase"
                      {...field}
                      onChange={(event) => {
                        setCodeTouched(true);
                        field.onChange(event.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>What people call it out loud.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <Combobox
                      options={customers.map((customer) => ({
                        value: customer.id,
                        label: customer.label,
                      }))}
                      value={field.value ?? undefined}
                      onChange={(value) =>
                        form.setValue('customerId', value, { shouldDirty: true })
                      }
                      placeholder="Internal project — no customer"
                      searchPlaceholder="Search customers…"
                      emptyMessage="No customer matches that search."
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty for work you are doing for yourselves.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>What it covers</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Scope, deliverables, anything the team should know."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Dates, money and progress</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      form.setValue('status', value as ProjectInput['status'], {
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
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
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
                  <FormDescription>
                    In {currency}. Spend is worked out from the hours booked, not typed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Starts</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Projects past this date are flagged as late.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Progress — {progress}%</FormLabel>
                  <FormControl>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      name={field.name}
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                      aria-label="Progress"
                    />
                  </FormControl>
                  <FormDescription>
                    Your own read on how far along it is.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={projectId ? `/projects/${projectId}` : '/projects'}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              loading={form.formState.isSubmitting}
            >
              {projectId ? 'Save changes' : 'Open the project'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

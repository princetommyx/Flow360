'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  createEmployeeAction,
  updateEmployeeAction,
} from '@/server/actions/employees';
import { employeeSchema, type EmployeeInput } from '@/lib/validations/employee';
import { toDateInput } from '@/lib/date';

const TYPE_LABELS: Record<EmployeeInput['employmentType'], string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

const STATUS_LABELS: Record<EmployeeInput['status'], string> = {
  ACTIVE: 'Active',
  PROBATION: 'On probation',
  ON_LEAVE: 'On leave',
  TERMINATED: 'Left',
};

export function EmployeeForm({
  employeeId,
  defaultValues,
  currency,
}: {
  employeeId?: string;
  defaultValues?: Partial<EmployeeInput>;
  currency: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [today] = React.useState(() => toDateInput(new Date()));

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      hiredAt: today,
      terminatedAt: '',
      baseSalary: 0,
      addressLine1: '',
      city: '',
      country: '',
      bankAccount: '',
      taxNumber: '',
      notes: '',
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const status = useWatch({ control: form.control, name: 'status' });

  async function submit(values: EmployeeInput) {
    setError(null);
    const result = await runAction(() =>
      employeeId
        ? updateEmployeeAction(employeeId, values)
        : createEmployeeAction(values),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof EmployeeInput, { message: result.error });
      }
      return;
    }

    toast.success(employeeId ? 'Details updated' : `${values.firstName} added`);
    router.push(`/employees/${result.data.id}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Who they are</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>First name</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Last name</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input inputMode="tel" placeholder="+233 24 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">The job</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Workshop supervisor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Operations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Employment</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      form.setValue(
                        'employmentType',
                        value as EmployeeInput['employmentType'],
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      form.setValue('status', value as EmployeeInput['status'], {
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
              name="hiredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Started</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {status === 'TERMINATED' ? (
              <FormField
                control={form.control}
                name="terminatedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Left</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Base pay</FormLabel>
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
                    Per pay period, in {currency}. Carried onto each payslip as the
                    starting figure.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Pay and records</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank or mobile money account</FormLabel>
                  <FormControl>
                    <Input placeholder="Where their pay goes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax number</FormLabel>
                  <FormControl>
                    <Input placeholder="TIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Anything worth knowing — contract terms, next of kin, review dates."
                      {...field}
                    />
                  </FormControl>
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
              <Link href={employeeId ? `/employees/${employeeId}` : '/employees'}>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              loading={form.formState.isSubmitting}
            >
              {employeeId ? 'Save changes' : 'Add to the team'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

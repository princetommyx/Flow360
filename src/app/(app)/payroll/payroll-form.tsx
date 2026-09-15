'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FormStatus } from '@/components/shared/form-status';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { runAction } from '@/lib/client-action';
import {
  createPayrollAction,
  updatePayrollAction,
} from '@/server/actions/payroll';
import { payrollSchema, type PayrollInput } from '@/lib/validations/employee';
import { calculatePayslip, formatCurrency } from '@/lib/money';
import { toDateInput } from '@/lib/date';

export type PayrollEmployeeOption = {
  id: string;
  name: string;
  employeeNumber: string;
  baseSalary: number;
  position: string | null;
};

export function PayrollForm({
  payrollId,
  defaultValues,
  employees,
  currency,
}: {
  payrollId?: string;
  defaultValues?: Partial<PayrollInput>;
  employees: PayrollEmployeeOption[];
  currency: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<'draft' | 'approve' | null>(
    null,
  );

  // The month just gone is the period someone is almost always paying for.
  const [period] = React.useState(() => {
    const now = new Date();
    return {
      start: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  });

  const form = useForm<PayrollInput>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      employeeId: '',
      periodStart: period.start,
      periodEnd: period.end,
      baseSalary: 0,
      allowances: 0,
      overtime: 0,
      bonus: 0,
      taxDeduction: 0,
      otherDeduction: 0,
      notes: '',
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const values = useWatch({ control: form.control });
  const totals = calculatePayslip({
    baseSalary: Number(values.baseSalary) || 0,
    allowances: Number(values.allowances) || 0,
    overtime: Number(values.overtime) || 0,
    bonus: Number(values.bonus) || 0,
    taxDeduction: Number(values.taxDeduction) || 0,
    otherDeduction: Number(values.otherDeduction) || 0,
  });

  /** Picking someone carries their contracted pay in as the starting figure. */
  function chooseEmployee(employeeId: string) {
    form.setValue('employeeId', employeeId, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const employee = employees.find((candidate) => candidate.id === employeeId);
    if (employee && !form.getValues('baseSalary')) {
      form.setValue('baseSalary', employee.baseSalary, { shouldDirty: true });
    }
  }

  async function submit(input: PayrollInput, approve: boolean) {
    setError(null);
    setPendingAction(approve ? 'approve' : 'draft');
    try {
      const result = await runAction(() =>
        payrollId
          ? updatePayrollAction(payrollId, input)
          : createPayrollAction(input, { approve }),
      );

      if (!result.ok) {
        setError(result.error);
        if (result.field && result.field in input) {
          form.setError(result.field as keyof PayrollInput, { message: result.error });
        }
        return;
      }

      toast.success(
        payrollId ? 'Payslip updated' : approve ? 'Payslip approved' : 'Draft saved',
      );
      router.push(`/payroll/${result.data.id}`);
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  const money = (name: keyof PayrollInput, label: string, description?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className="tabular"
              name={field.name}
              value={typeof field.value === 'number' ? field.value : 0}
              onChange={(event) =>
                field.onChange(
                  event.target.value === '' ? 0 : Number(event.target.value),
                )
              }
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((input) => submit(input, false))}
        className="space-y-6"
        noValidate
      >
        <FormStatus error={error} />

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Who and when</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel required>Employee</FormLabel>
                      <FormControl>
                        <Combobox
                          options={employees.map((employee) => ({
                            value: employee.id,
                            label: employee.name,
                            description:
                              employee.position ?? employee.employeeNumber,
                            meta: formatCurrency(employee.baseSalary, { currency }),
                          }))}
                          value={field.value || undefined}
                          onChange={chooseEmployee}
                          disabled={Boolean(payrollId)}
                          placeholder="Choose who this payslip is for"
                          searchPlaceholder="Search the team…"
                          emptyMessage="Nobody matches that search."
                          aria-invalid={Boolean(form.formState.errors.employeeId)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="periodStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Period from</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="periodEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Period to</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">What they earned</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                {money('baseSalary', 'Base pay', 'Their contracted pay for this period.')}
                {money('allowances', 'Allowances', 'Transport, housing, and the like.')}
                {money('overtime', 'Overtime')}
                {money('bonus', 'Bonus')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">What comes off</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                {money('taxDeduction', 'Tax', 'PAYE and anything else withheld.')}
                {money('otherDeduction', 'Other deductions', 'Loans, advances, pension.')}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Anything the payslip should explain — a one-off adjustment, a correction."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Net is derived from the figures above, never typed, so the payslip
              cannot disagree with its own arithmetic. */}
          <div className="rounded-xl border border-border bg-surface-subtle p-5 lg:sticky lg:top-24 lg:self-start">
            <dl className="space-y-2.5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Gross pay</dt>
                <dd className="font-medium tabular">
                  {formatCurrency(totals.gross, { currency })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Deductions</dt>
                <dd className="font-medium tabular">
                  {totals.deductions > 0 ? '− ' : ''}
                  {formatCurrency(totals.deductions, { currency })}
                </dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-medium">Take-home</span>
              <span className="text-xl font-semibold tracking-[-0.02em] tabular">
                {formatCurrency(totals.net, { currency })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={payrollId ? `/payroll/${payrollId}` : '/payroll'}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant={payrollId ? 'default' : 'secondary'}
              className="flex-1 sm:flex-none"
              loading={pendingAction === 'draft'}
              disabled={pendingAction !== null}
            >
              {payrollId ? 'Save changes' : 'Save draft'}
            </Button>
            {!payrollId ? (
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                loading={pendingAction === 'approve'}
                disabled={pendingAction !== null}
                onClick={form.handleSubmit((input) => submit(input, true))}
              >
                <Check /> Save &amp; approve
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Form>
  );
}

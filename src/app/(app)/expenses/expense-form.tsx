'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/shared/form-section';
import { FormStatus } from '@/components/shared/form-status';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { createExpenseAction, updateExpenseAction } from '@/server/actions/expenses';
import { expenseSchema, type ExpenseInput } from '@/lib/validations/expense';
import { formatCurrency } from '@/lib/money';
import { toDateInput } from '@/lib/date';

const METHODS: Array<{ value: ExpenseInput['method']; label: string }> = [
  { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CHECK', label: 'Check' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
];

const STATUSES: Array<{ value: ExpenseInput['status']; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REIMBURSED', label: 'Reimbursed' },
  { value: 'REJECTED', label: 'Rejected' },
];

type Option = { id: string; name: string };

export function ExpenseForm({
  expenseId,
  defaultValues,
  categories,
  suppliers,
  accounts,
  currency,
  taxLabel,
}: {
  expenseId?: string;
  defaultValues?: Partial<ExpenseInput>;
  categories: Option[];
  suppliers: Array<{ id: string; name: string; companyName: string | null }>;
  accounts: Option[];
  currency: string;
  taxLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [today] = React.useState(() => toDateInput(new Date()));

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: null,
      supplierId: null,
      accountId: null,
      vendorName: '',
      amount: 0,
      taxAmount: 0,
      method: 'CARD',
      status: 'APPROVED',
      spentAt: today,
      reference: '',
      billable: false,
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const amount = useWatch({ control: form.control, name: 'amount' }) ?? 0;
  const taxAmount = useWatch({ control: form.control, name: 'taxAmount' }) ?? 0;
  const total = Number(amount) + Number(taxAmount);

  async function onSubmit(values: ExpenseInput) {
    setError(null);
    const result = expenseId
      ? await updateExpenseAction(expenseId, values)
      : await createExpenseAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof ExpenseInput, { message: result.error });
      }
      return;
    }

    toast.success(expenseId ? 'Expense updated' : 'Expense recorded');
    router.push('/expenses');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardContent className="space-y-8 pt-6">
            <FormSection title="What was spent" description="The essentials.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel required>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Diesel for the delivery van" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{taxLabel}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormDescription>
                        Total {formatCurrency(total, { currency })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spentAt"
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Combobox
                          options={categories.map((category) => ({
                            value: category.id,
                            label: category.name,
                          }))}
                          value={field.value ?? undefined}
                          onChange={(value) =>
                            form.setValue('categoryId', value, { shouldDirty: true })
                          }
                          placeholder="Uncategorised"
                          searchPlaceholder="Search categories…"
                          emptyMessage="No category matches that search."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <Separator />

            <FormSection
              title="Who and where"
              description="Optional, but it makes the reports far more useful."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Combobox
                          options={suppliers.map((supplier) => ({
                            value: supplier.id,
                            label: supplier.companyName ?? supplier.name,
                          }))}
                          value={field.value ?? undefined}
                          onChange={(value) =>
                            form.setValue('supplierId', value, { shouldDirty: true })
                          }
                          placeholder="Not a recorded supplier"
                          searchPlaceholder="Search suppliers…"
                          emptyMessage="No supplier matches that search."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or a one-off payee</FormLabel>
                      <FormControl>
                        <Input placeholder="Shell Spintex" {...field} />
                      </FormControl>
                      <FormDescription>
                        For someone you buy from once and will not set up.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid from</FormLabel>
                      <FormControl>
                        <Combobox
                          options={accounts.map((account) => ({
                            value: account.id,
                            label: account.name,
                          }))}
                          value={field.value ?? undefined}
                          onChange={(value) =>
                            form.setValue('accountId', value, { shouldDirty: true })
                          }
                          placeholder="Not recorded"
                          searchPlaceholder="Search accounts…"
                          emptyMessage="No account matches that search."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Only approved and reimbursed spend counts towards profit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Receipt or transaction number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Anything worth remembering." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billable"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 sm:col-span-2">
                      <div>
                        <FormLabel>Rebillable to a customer</FormLabel>
                        <FormDescription>
                          Flags it so it can be put on an invoice later.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href="/expenses">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              loading={form.formState.isSubmitting}
            >
              {expenseId ? 'Save changes' : 'Record expense'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { FormStatus } from '@/components/shared/form-status';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { LineEditor, EMPTY_LINE, type ProductOption } from '@/components/documents/line-editor';
import { TotalsPanel } from '@/components/documents/totals-panel';
import { createInvoiceAction, updateInvoiceAction } from '@/server/actions/invoices';
import { invoiceSchema, type InvoiceInput } from '@/lib/validations/document';
import { toDateInput } from '@/lib/date';
import { locale } from '@/lib/config/brand';

export type CustomerOption = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  paymentTermDays: number;
};

export function InvoiceForm({
  invoiceId,
  defaultValues,
  customers,
  products,
  currency,
  taxLabel,
  defaultTermDays,
  defaultNotes,
  defaultTerms,
}: {
  invoiceId?: string;
  defaultValues?: Partial<InvoiceInput>;
  customers: CustomerOption[];
  products: ProductOption[];
  currency: string;
  taxLabel: string;
  defaultTermDays: number;
  defaultNotes: string;
  defaultTerms: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<'draft' | 'send' | null>(
    null,
  );

  // Reading the clock during render is impure and would give the form a new
  // default on every pass; resolve both dates once, on mount.
  const [today] = React.useState(() => toDateInput(new Date()));
  const [defaultDueDate] = React.useState(() =>
    toDateInput(new Date(Date.now() + defaultTermDays * 86_400_000)),
  );

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      issueDate: today,
      dueDate: defaultDueDate,
      reference: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      shippingAmount: 0,
      notes: defaultNotes,
      terms: defaultTerms,
      projectId: null,
      items: [{ ...EMPTY_LINE, taxRate: locale.defaultTaxRate }],
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  /** Selecting a customer pulls their agreed payment terms onto the due date. */
  function applyCustomer(customerId: string) {
    form.setValue('customerId', customerId, { shouldDirty: true, shouldValidate: true });

    const customer = customers.find((candidate) => candidate.id === customerId);
    if (!customer) return;

    const issue = new Date(form.getValues('issueDate') || today);
    form.setValue(
      'dueDate',
      toDateInput(new Date(issue.getTime() + customer.paymentTermDays * 86_400_000)),
      { shouldDirty: true },
    );
  }

  async function submit(values: InvoiceInput, send: boolean) {
    setError(null);
    setPendingAction(send ? 'send' : 'draft');
    try {
      const result = invoiceId
        ? await updateInvoiceAction(invoiceId, values)
        : await createInvoiceAction(values, { send });

      if (!result.ok) {
        setError(result.error);
        if (result.field && result.field in values) {
          form.setError(result.field as keyof InvoiceInput, { message: result.error });
        }
        return;
      }

      toast.success(
        invoiceId ? 'Invoice updated' : send ? 'Invoice sent' : 'Draft saved',
      );
      router.push(`/invoices/${result.data.id}`);
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.companyName ?? customer.name,
    description: customer.companyName ? customer.name : (customer.email ?? undefined),
    meta: `${customer.paymentTermDays}d terms`,
  }));

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit(values, false))}
        className="space-y-6"
        noValidate
      >
        <FormStatus error={error} />

        <Card>
          <CardContent className="grid gap-5 pt-6 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="lg:col-span-3">
                  <FormLabel required>Customer</FormLabel>
                  <FormControl>
                    <Combobox
                      options={customerOptions}
                      value={field.value || undefined}
                      onChange={applyCustomer}
                      placeholder="Choose who this invoice is for"
                      searchPlaceholder="Search customers…"
                      emptyMessage="No customer matches that search."
                      aria-invalid={Boolean(form.formState.errors.customerId)}
                    />
                  </FormControl>
                  <FormDescription>
                    Their agreed payment terms set the due date automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Issue date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Due date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Their PO number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-[14px] font-semibold tracking-[-0.01em]">
            Items
          </h2>
          <LineEditor
            control={form.control}
            setValue={form.setValue}
            products={products}
            currency={currency}
            error={form.formState.errors.items?.message}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <Card>
            <CardContent className="grid gap-5 pt-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Anything the customer should read alongside the figures."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment terms</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Payment due within 14 days of the invoice date."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Printed at the foot of the invoice.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <TotalsPanel
            control={form.control}
            currency={currency}
            taxLabel={taxLabel}
            withShipping
            onDiscountTypeChange={(value) =>
              form.setValue('discountType', value, { shouldDirty: true })
            }
            onDiscountValueChange={(value) =>
              form.setValue('discountValue', value, { shouldDirty: true })
            }
            onShippingChange={(value) =>
              form.setValue('shippingAmount', value, { shouldDirty: true })
            }
          />
        </div>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={invoiceId ? `/invoices/${invoiceId}` : '/invoices'}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant={invoiceId ? 'default' : 'secondary'}
              className="flex-1 sm:flex-none"
              loading={pendingAction === 'draft'}
              disabled={pendingAction !== null}
            >
              {invoiceId ? 'Save changes' : 'Save draft'}
            </Button>
            {!invoiceId ? (
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                loading={pendingAction === 'send'}
                disabled={pendingAction !== null}
                onClick={form.handleSubmit((values) => submit(values, true))}
              >
                <Send /> Save &amp; send
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Form>
  );
}

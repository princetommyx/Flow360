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
import {
  LineEditor,
  EMPTY_LINE,
  type ProductOption,
} from '@/components/documents/line-editor';
import { TotalsPanel } from '@/components/documents/totals-panel';
import {
  createQuotationAction,
  updateQuotationAction,
} from '@/server/actions/quotations';
import { quotationSchema, type QuotationInput } from '@/lib/validations/document';
import type { CustomerOption } from '@/app/(app)/invoices/invoice-form';
import { toDateInput } from '@/lib/date';
import { locale } from '@/lib/config/brand';

/** How long a new quotation stays valid unless the writer says otherwise. */
const DEFAULT_VALID_DAYS = 30;

export function QuotationForm({
  quotationId,
  defaultValues,
  customers,
  products,
  currency,
  taxLabel,
  defaultNotes,
  defaultTerms,
}: {
  quotationId?: string;
  defaultValues?: Partial<QuotationInput>;
  customers: CustomerOption[];
  products: ProductOption[];
  currency: string;
  taxLabel: string;
  defaultNotes: string;
  defaultTerms: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<'draft' | 'send' | null>(
    null,
  );

  // Reading the clock during render is impure and would hand the form a new
  // default on every pass; resolve both dates once, on mount.
  const [today] = React.useState(() => toDateInput(new Date()));
  const [defaultExpiry] = React.useState(() =>
    toDateInput(new Date(Date.now() + DEFAULT_VALID_DAYS * 86_400_000)),
  );

  const form = useForm<QuotationInput>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: '',
      issueDate: today,
      expiryDate: defaultExpiry,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      notes: defaultNotes,
      terms: defaultTerms,
      items: [{ ...EMPTY_LINE, taxRate: locale.defaultTaxRate }],
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function submit(values: QuotationInput, send: boolean) {
    setError(null);
    setPendingAction(send ? 'send' : 'draft');
    try {
      const result = quotationId
        ? await updateQuotationAction(quotationId, values)
        : await createQuotationAction(values, { send });

      if (!result.ok) {
        setError(result.error);
        if (result.field && result.field in values) {
          form.setError(result.field as keyof QuotationInput, { message: result.error });
        }
        return;
      }

      toast.success(
        quotationId ? 'Quotation updated' : send ? 'Quotation sent' : 'Draft saved',
      );
      router.push(`/quotations/${result.data.id}`);
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.companyName ?? customer.name,
    description: customer.companyName ? customer.name : (customer.email ?? undefined),
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
                      onChange={(value) =>
                        form.setValue('customerId', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder="Choose who this quotation is for"
                      searchPlaceholder="Search customers…"
                      emptyMessage="No customer matches that search."
                      aria-invalid={Boolean(form.formState.errors.customerId)}
                    />
                  </FormControl>
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
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Valid until</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    After this date the quotation lapses on its own.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-[14px] font-semibold tracking-[-0.01em]">Items</h2>
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
                        placeholder="Scope, assumptions, or anything the price depends on."
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
                    <FormLabel>Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Lead times, payment terms, or what happens after acceptance."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Printed at the foot of the quotation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* No shipping line: a quotation prices the work, and delivery is
              settled on the invoice it becomes. */}
          <TotalsPanel
            control={form.control}
            currency={currency}
            taxLabel={taxLabel}
            onDiscountTypeChange={(value) =>
              form.setValue('discountType', value, { shouldDirty: true })
            }
            onDiscountValueChange={(value) =>
              form.setValue('discountValue', value, { shouldDirty: true })
            }
          />
        </div>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={quotationId ? `/quotations/${quotationId}` : '/quotations'}>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              variant={quotationId ? 'default' : 'secondary'}
              className="flex-1 sm:flex-none"
              loading={pendingAction === 'draft'}
              disabled={pendingAction !== null}
            >
              {quotationId ? 'Save changes' : 'Save draft'}
            </Button>
            {!quotationId ? (
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

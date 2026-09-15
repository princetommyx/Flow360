'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
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
import { PurchaseTotals } from '@/components/documents/purchase-totals';
import { runAction } from '@/lib/client-action';
import { createBillAction, updateBillAction } from '@/server/actions/bills';
import { billSchema, type BillInput } from '@/lib/validations/purchasing';
import { toDateInput } from '@/lib/date';
import { locale } from '@/lib/config/brand';

/** Default payment terms when the supplier has not set one. */
const DEFAULT_TERM_DAYS = 30;

export function BillForm({
  billId,
  defaultValues,
  suppliers,
  products,
  currency,
  taxLabel,
  linkedOrderNumber,
}: {
  billId?: string;
  defaultValues?: Partial<BillInput>;
  suppliers: Array<{ id: string; label: string }>;
  products: ProductOption[];
  currency: string;
  taxLabel: string;
  /** Set when the bill is being raised from a purchase order. */
  linkedOrderNumber?: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<'draft' | 'approve' | null>(
    null,
  );

  // Reading the clock during render is impure and would hand the form a new
  // default on every pass; resolve both dates once, on mount.
  const [today] = React.useState(() => toDateInput(new Date()));
  const [defaultDue] = React.useState(() =>
    toDateInput(new Date(Date.now() + DEFAULT_TERM_DAYS * 86_400_000)),
  );

  const form = useForm<BillInput>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      supplierId: '',
      purchaseOrderId: null,
      supplierRef: '',
      issueDate: today,
      dueDate: defaultDue,
      notes: '',
      items: [{ ...EMPTY_LINE, taxRate: locale.defaultTaxRate }],
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function submit(values: BillInput, approve: boolean) {
    setError(null);
    setPendingAction(approve ? 'approve' : 'draft');
    try {
      const result = await runAction(() =>
        billId
          ? updateBillAction(billId, values)
          : createBillAction(values, { approve }),
      );

      if (!result.ok) {
        setError(result.error);
        if (result.field && result.field in values) {
          form.setError(result.field as keyof BillInput, { message: result.error });
        }
        return;
      }

      toast.success(
        billId ? 'Bill updated' : approve ? 'Bill approved for payment' : 'Draft saved',
      );
      router.push(`/bills/${result.data.id}`);
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => submit(values, false))}
        className="space-y-6"
        noValidate
      >
        <FormStatus error={error} />

        {linkedOrderNumber ? (
          <p className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-[13px] text-muted-foreground">
            Raised against purchase order{' '}
            <span className="font-mono font-medium text-foreground">
              {linkedOrderNumber}
            </span>
            . Its lines are copied below, so change them to match what the supplier
            actually invoiced.
          </p>
        ) : null}

        <Card>
          <CardContent className="grid gap-5 pt-6 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel required>Supplier</FormLabel>
                  <FormControl>
                    <Combobox
                      options={suppliers.map((supplier) => ({
                        value: supplier.id,
                        label: supplier.label,
                      }))}
                      value={field.value || undefined}
                      onChange={(value) =>
                        form.setValue('supplierId', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={Boolean(linkedOrderNumber)}
                      placeholder="Choose who billed you"
                      searchPlaceholder="Search suppliers…"
                      emptyMessage="No supplier matches that search."
                      aria-invalid={Boolean(form.formState.errors.supplierId)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Their invoice number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2026-4471" {...field} />
                  </FormControl>
                  <FormDescription>What the supplier calls it.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Invoice date</FormLabel>
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
                  <FormLabel required>Due</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Bills past this date are flagged as overdue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-[14px] font-semibold tracking-[-0.01em]">
            What you were billed for
          </h2>
          <LineEditor
            control={form.control}
            setValue={form.setValue}
            products={products}
            currency={currency}
            showDiscount={false}
            addLabel="Add item"
            error={form.formState.errors.items?.message}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Anything to remember when this is paid: a query, a credit expected, who approved it."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* No supplier discount field: a bill records what you were charged,
              and a discount is already in the figures on it. */}
          <PurchaseTotals control={form.control} currency={currency} taxLabel={taxLabel} readOnly />
        </div>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={billId ? `/bills/${billId}` : '/bills'}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant={billId ? 'default' : 'secondary'}
              className="flex-1 sm:flex-none"
              loading={pendingAction === 'draft'}
              disabled={pendingAction !== null}
            >
              {billId ? 'Save changes' : 'Save draft'}
            </Button>
            {!billId ? (
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                loading={pendingAction === 'approve'}
                disabled={pendingAction !== null}
                onClick={form.handleSubmit((values) => submit(values, true))}
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

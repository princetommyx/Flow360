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
import { PurchaseTotals } from '@/components/documents/purchase-totals';
import { runAction } from '@/lib/client-action';
import {
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
} from '@/server/actions/purchase-orders';
import {
  purchaseOrderSchema,
  type PurchaseOrderInput,
} from '@/lib/validations/purchasing';
import { toDateInput } from '@/lib/date';
import { locale } from '@/lib/config/brand';

/** How far out a new order is expected unless the writer says otherwise. */
const DEFAULT_LEAD_DAYS = 14;

export function PurchaseOrderForm({
  purchaseOrderId,
  defaultValues,
  suppliers,
  products,
  currency,
  taxLabel,
}: {
  purchaseOrderId?: string;
  defaultValues?: Partial<PurchaseOrderInput>;
  suppliers: Array<{ id: string; label: string }>;
  products: ProductOption[];
  currency: string;
  taxLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<'draft' | 'send' | null>(null);

  // Reading the clock during render is impure and would hand the form a new
  // default on every pass; resolve both dates once, on mount.
  const [today] = React.useState(() => toDateInput(new Date()));
  const [defaultExpected] = React.useState(() =>
    toDateInput(new Date(Date.now() + DEFAULT_LEAD_DAYS * 86_400_000)),
  );

  const form = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      orderDate: today,
      expectedDate: defaultExpected,
      discountAmount: 0,
      notes: '',
      items: [{ ...EMPTY_LINE, taxRate: locale.defaultTaxRate }],
      ...defaultValues,
    },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function submit(values: PurchaseOrderInput, send: boolean) {
    setError(null);
    setPendingAction(send ? 'send' : 'draft');
    try {
      const result = await runAction(() =>
        purchaseOrderId
          ? updatePurchaseOrderAction(purchaseOrderId, values)
          : createPurchaseOrderAction(values, { send }),
      );

      if (!result.ok) {
        setError(result.error);
        if (result.field && result.field in values) {
          form.setError(result.field as keyof PurchaseOrderInput, {
            message: result.error,
          });
        }
        return;
      }

      toast.success(
        purchaseOrderId ? 'Order updated' : send ? 'Order marked sent' : 'Draft saved',
      );
      router.push(`/purchase-orders/${result.data.id}`);
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

        <Card>
          <CardContent className="grid gap-5 pt-6 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem className="lg:col-span-3">
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
                      placeholder="Choose who you are ordering from"
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
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Order date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Orders past this date are flagged as late.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-[14px] font-semibold tracking-[-0.01em]">
            What you are ordering
          </h2>
          {/* No per-line discount: a supplier's price is the price you agreed. */}
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
                    <FormLabel>Notes for the supplier</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Delivery address, purchase reference, packing instructions."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <PurchaseTotals
            control={form.control}
            currency={currency}
            taxLabel={taxLabel}
            onDiscountChange={(value) =>
              form.setValue('discountAmount', value, { shouldDirty: true })
            }
          />
        </div>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link
                href={
                  purchaseOrderId
                    ? `/purchase-orders/${purchaseOrderId}`
                    : '/purchase-orders'
                }
              >
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              variant={purchaseOrderId ? 'default' : 'secondary'}
              className="flex-1 sm:flex-none"
              loading={pendingAction === 'draft'}
              disabled={pendingAction !== null}
            >
              {purchaseOrderId ? 'Save changes' : 'Save draft'}
            </Button>
            {!purchaseOrderId ? (
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                loading={pendingAction === 'send'}
                disabled={pendingAction !== null}
                onClick={form.handleSubmit((values) => submit(values, true))}
              >
                <Send /> Save &amp; mark sent
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Form>
  );
}

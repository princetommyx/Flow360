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
import { createProductAction, updateProductAction } from '@/server/actions/products';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { formatCurrency } from '@/lib/money';
import { locale } from '@/lib/config/brand';

type Option = { id: string; name: string };

const EMPTY: ProductInput = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  type: 'GOOD',
  categoryId: null,
  supplierId: null,
  unit: 'unit',
  purchasePrice: 0,
  sellingPrice: 0,
  taxRate: locale.defaultTaxRate,
  stockQuantity: 0,
  minStockLevel: 0,
  trackInventory: true,
  status: 'ACTIVE',
};

export function ProductForm({
  productId,
  defaultValues,
  categories,
  suppliers,
  currency,
}: {
  productId?: string;
  defaultValues?: Partial<ProductInput>;
  categories: Option[];
  suppliers: Option[];
  currency: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const type = useWatch({ control: form.control, name: 'type' });
  const trackInventory = useWatch({ control: form.control, name: 'trackInventory' });
  const purchasePrice = useWatch({ control: form.control, name: 'purchasePrice' });
  const sellingPrice = useWatch({ control: form.control, name: 'sellingPrice' });

  const isService = type === 'SERVICE';
  const margin =
    sellingPrice > 0 ? ((sellingPrice - purchasePrice) / sellingPrice) * 100 : null;

  async function onSubmit(values: ProductInput) {
    setError(null);
    const result = productId
      ? await updateProductAction(productId, values)
      : await createProductAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof ProductInput, { message: result.error });
      }
      return;
    }

    toast.success(productId ? 'Product updated' : 'Product added');
    router.push(`/products/${result.data.id}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardContent className="space-y-8 pt-6">
            <FormSection
              title="What it is"
              description="Goods can hold stock; services are billed by time or scope."
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Meridian Sit-Stand Desk 1600" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'SERVICE') {
                          form.setValue('trackInventory', false, { shouldDirty: true });
                          form.setValue('unit', 'hour', { shouldDirty: true });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GOOD">Good — physical item</SelectItem>
                        <SelectItem value="SERVICE">Service — labour or time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="WS-1600-OAK" className="font-mono" {...field} />
                    </FormControl>
                    <FormDescription>Unique within your catalogue.</FormDescription>
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
                        onChange={field.onChange}
                        placeholder="Uncategorised"
                        searchPlaceholder="Search categories…"
                        emptyMessage="No categories yet."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default supplier</FormLabel>
                    <FormControl>
                      <Combobox
                        options={suppliers.map((supplier) => ({
                          value: supplier.id,
                          label: supplier.name,
                        }))}
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="No default supplier"
                        searchPlaceholder="Search suppliers…"
                        emptyMessage="No suppliers yet."
                      />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Shown on quotes and invoices when you add this line."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <Separator />

            <FormSection
              title="Pricing"
              description="Cost drives margin reporting; the selling price is what customers are billed."
            >
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Selling price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      {margin === null
                        ? 'Set a price to see the margin.'
                        : `Margin ${margin.toFixed(1)}% · ${formatCurrency(sellingPrice - purchasePrice, { currency })} per ${form.getValues('unit') || 'unit'}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.001"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Prefilled on new lines; still editable per document.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder={isService ? 'hour' : 'unit'} {...field} />
                    </FormControl>
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
                        <SelectItem value="ACTIVE">Active — available to sell</SelectItem>
                        <SelectItem value="INACTIVE">Inactive — hidden from pickers</SelectItem>
                        <SelectItem value="BLOCKED">Blocked — cannot be sold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {!isService ? (
              <>
                <Separator />
                <FormSection
                  title="Stock"
                  description="Tracked items reduce automatically when you invoice them and rise when you receive a purchase order."
                >
                  <FormField
                    control={form.control}
                    name="trackInventory"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-subtle px-4 py-3">
                          <div>
                            <FormLabel htmlFor="track-inventory">
                              Track stock for this item
                            </FormLabel>
                            <FormDescription className="mt-1">
                              Turn off for made-to-order goods you never hold.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              id="track-inventory"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {trackInventory ? (
                    <>
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {productId ? 'Current stock' : 'Opening stock'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.001"
                                disabled={Boolean(productId)}
                                value={field.value}
                                onChange={(event) =>
                                  field.onChange(Number(event.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              {productId
                                ? 'Stock only moves through an adjustment, so every change is auditable.'
                                : 'Recorded as an opening stock movement.'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minStockLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder point</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.001"
                                value={field.value}
                                onChange={(event) =>
                                  field.onChange(Number(event.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Below this level the item is flagged as low stock.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : null}
                </FormSection>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={productId ? `/products/${productId}` : '/products'}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              loading={form.formState.isSubmitting}
            >
              {productId ? 'Save changes' : 'Add product'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

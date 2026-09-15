'use client';

import * as React from 'react';
import {
  useController,
  useFieldArray,
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
} from 'react-hook-form';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form';
import { calculateLine, formatCurrency, formatNumber } from '@/lib/money';
import { cn } from '@/lib/utils';

export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  sellingPrice: number;
  taxRate: number;
  stockQuantity: number;
  trackInventory: boolean;
  type: string;
};

/** The subset of the form shape this editor touches. */
type LineFormValues = {
  items: Array<{
    productId?: string | null;
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    /* Optional: purchase documents keep no per-line discount. */
    discountRate?: number;
    taxRate: number;
  }>;
};

export const EMPTY_LINE = {
  productId: null,
  name: '',
  description: '',
  quantity: 1,
  unit: 'unit',
  unitPrice: 0,
  discountRate: 0,
  taxRate: 0,
};

/**
 * Line items for a quotation or invoice.
 *
 * Picking a catalogue product fills the description, unit, price and tax rate,
 * but every field stays editable afterwards — the document records what was
 * agreed, not what the catalogue says today.
 */
export function LineEditor<TFieldValues extends FieldValues & LineFormValues>({
  control: outerControl,
  setValue: outerSetValue,
  products,
  currency,
  error,
  /*
    Purchase orders and bills have no per-line discount to keep: what a
    supplier gives you is negotiated into the unit price before it reaches the
    document. Offering the field there would take a number the record cannot
    store and quietly drop it.
  */
  showDiscount = true,
  addLabel,
}: {
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  products: ProductOption[];
  currency: string;
  error?: string;
  showDiscount?: boolean;
  addLabel?: string;
}) {
  // React Hook Form's `Control` is invariant in its field-values type, so a
  // shared component cannot accept one structurally. The generic keeps call
  // sites type-checked; the narrowing happens once, here.
  const control = outerControl as unknown as Control<LineFormValues>;
  const setValue = outerSetValue as unknown as UseFormSetValue<LineFormValues>;

  const columns = showDiscount
    ? 'lg:grid-cols-[minmax(0,1fr)_5rem_7rem_5rem_5rem_7rem_2.25rem]'
    : 'lg:grid-cols-[minmax(0,1fr)_5rem_7rem_5rem_7rem_2.25rem]';

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) ?? [];

  const options = React.useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
        description: `${product.sku}${
          product.trackInventory
            ? ` · ${formatNumber(product.stockQuantity, 0)} ${product.unit} in stock`
            : ''
        }`,
        meta: formatCurrency(product.sellingPrice, { currency }),
      })),
    [products, currency],
  );

  function applyProduct(index: number, productId: string) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) return;

    setValue(`items.${index}.productId`, product.id, { shouldDirty: true });
    setValue(`items.${index}.name`, product.name, { shouldDirty: true });
    setValue(`items.${index}.unit`, product.unit, { shouldDirty: true });
    setValue(`items.${index}.unitPrice`, product.sellingPrice, { shouldDirty: true });
    setValue(`items.${index}.taxRate`, product.taxRate, { shouldDirty: true });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        {/* Column headings — desktop only; each row is self-labelling on mobile */}
        <div className={cn(
            'hidden gap-3 border-b border-border bg-surface-subtle px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid',
            columns,
          )}>
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          {showDiscount ? <span className="text-right">Disc %</span> : null}
          <span className="text-right">Tax %</span>
          <span className="text-right">Total</span>
          <span className="sr-only">Remove</span>
        </div>

        <ul className="divide-y divide-border">
          {fields.map((field, index) => {
            const line = items[index];
            const totals = line
              ? calculateLine({
                  quantity: Number(line.quantity) || 0,
                  unitPrice: Number(line.unitPrice) || 0,
                  discountRate: Number(line.discountRate) || 0,
                  taxRate: Number(line.taxRate) || 0,
                })
              : null;

            const product = products.find(
              (candidate) => candidate.id === line?.productId,
            );
            const shortfall =
              product?.trackInventory &&
              Number(line?.quantity) > product.stockQuantity;

            return (
              <li
                key={field.id}
                className={cn('grid gap-3 px-4 py-3.5 lg:items-start lg:gap-3', columns)}
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical
                      className="hidden size-4 shrink-0 text-muted-foreground/50 lg:block"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <Combobox
                        options={options}
                        value={line?.productId ?? undefined}
                        onChange={(value) => applyProduct(index, value)}
                        placeholder="Pick from catalogue, or type below"
                        searchPlaceholder="Search products and services…"
                        emptyMessage="No catalogue match — type a description instead."
                        className="h-8 text-[13px]"
                      />
                    </div>
                  </div>

                  <LineField
                    control={control}
                    name={`items.${index}.name`}
                    placeholder="Description on the document"
                    label="Description"
                  />

                  {shortfall ? (
                    <p className="text-[11.5px] font-medium text-warning-foreground">
                      Only {formatNumber(product.stockQuantity, 0)} {product.unit} in
                      stock — sending this will be blocked until stock is received.
                    </p>
                  ) : null}
                </div>

                <NumberField
                  control={control}
                  name={`items.${index}.quantity`}
                  label="Qty"
                  min={0}
                  step="0.001"
                />
                <NumberField
                  control={control}
                  name={`items.${index}.unitPrice`}
                  label="Unit price"
                  min={0}
                  step="0.01"
                />
                {showDiscount ? (
                  <NumberField
                    control={control}
                    name={`items.${index}.discountRate`}
                    label="Discount %"
                    min={0}
                    max={100}
                    step="0.01"
                  />
                ) : null}
                <NumberField
                  control={control}
                  name={`items.${index}.taxRate`}
                  label="Tax %"
                  min={0}
                  max={100}
                  step="0.001"
                />

                <div className="flex items-center justify-between gap-2 lg:block lg:pt-2 lg:text-right">
                  <span className="text-[12px] text-muted-foreground lg:hidden">
                    Line total
                  </span>
                  <span className="text-[13.5px] font-semibold tabular">
                    {formatCurrency(totals?.lineTotal ?? 0, { currency })}
                  </span>
                </div>

                <div className="flex justify-end lg:pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    aria-label={`Remove line ${index + 1}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ ...EMPTY_LINE })}
        >
          <Plus /> {addLabel ?? 'Add line'}
        </Button>
        {error ? <FormMessage>{error}</FormMessage> : null}
      </div>
    </div>
  );
}

/**
 * Leaf inputs own their own `useController` subscription, so a change to one
 * line does not re-render the whole document.
 */
function LineField({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<LineFormValues>;
  name: FieldPath<LineFormValues>;
  label: string;
  placeholder?: string;
}) {
  const { field, fieldState } = useController({ control, name });

  return (
    <div>
      <Label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground lg:sr-only">
        {label}
      </Label>
      <Input
        {...field}
        value={(field.value as string) ?? ''}
        placeholder={placeholder}
        aria-invalid={Boolean(fieldState.error)}
        className="h-8 text-[13px]"
      />
      {fieldState.error ? (
        <p className="mt-1 text-[11.5px] font-medium text-destructive">
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  );
}

function NumberField({
  control,
  name,
  label,
  min,
  max,
  step,
}: {
  control: Control<LineFormValues>;
  name: FieldPath<LineFormValues>;
  label: string;
  min?: number;
  max?: number;
  step?: string;
}) {
  const { field, fieldState } = useController({ control, name });

  return (
    <div>
      <Label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground lg:sr-only">
        {label}
      </Label>
      <Input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        {...field}
        value={(field.value as number | undefined) ?? 0}
        // An empty input reads as 0 rather than NaN, which would break totals.
        onChange={(event) =>
          field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
        }
        aria-invalid={Boolean(fieldState.error)}
        className={cn('h-8 text-right text-[13px] tabular')}
      />
      {fieldState.error ? (
        <p className="mt-1 text-[11.5px] font-medium text-destructive">
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  );
}

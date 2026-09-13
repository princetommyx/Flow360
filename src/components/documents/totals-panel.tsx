'use client';

import { useWatch, type Control, type FieldValues } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { calculateDocumentTotals, formatCurrency } from '@/lib/money';

type TotalsFormValues = {
  items: Array<{
    quantity: number;
    unitPrice: number;
    discountRate: number;
    taxRate: number;
  }>;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  shippingAmount?: number;
};

/**
 * Live document totals.
 *
 * Uses the same `calculateDocumentTotals` the server writes with, so the figure
 * on screen is exactly what will be stored — no second implementation to drift.
 */
export function TotalsPanel<TFieldValues extends FieldValues & TotalsFormValues>({
  control: outerControl,
  currency,
  onDiscountTypeChange,
  onDiscountValueChange,
  onShippingChange,
  withShipping = false,
  taxLabel,
}: {
  control: Control<TFieldValues>;
  currency: string;
  onDiscountTypeChange: (value: 'PERCENTAGE' | 'FIXED') => void;
  onDiscountValueChange: (value: number) => void;
  onShippingChange?: (value: number) => void;
  withShipping?: boolean;
  taxLabel: string;
}) {
  // See LineEditor: `Control` is invariant, so narrow once here.
  const control = outerControl as unknown as Control<TotalsFormValues>;

  const items = useWatch({ control, name: 'items' }) ?? [];
  const discountType = useWatch({ control, name: 'discountType' }) ?? 'PERCENTAGE';
  const discountValue = useWatch({ control, name: 'discountValue' }) ?? 0;
  const shippingAmount = useWatch({ control, name: 'shippingAmount' }) ?? 0;

  const totals = calculateDocumentTotals({
    lines: items.map((item) => ({
      quantity: Number(item?.quantity) || 0,
      unitPrice: Number(item?.unitPrice) || 0,
      discountRate: Number(item?.discountRate) || 0,
      taxRate: Number(item?.taxRate) || 0,
    })),
    discountType,
    discountValue: Number(discountValue) || 0,
    shippingAmount: withShipping ? Number(shippingAmount) || 0 : 0,
  });

  return (
    <div className="rounded-xl border border-border bg-surface-subtle p-5">
      <dl className="space-y-2.5 text-[13.5px]">
        <Row label="Subtotal" value={formatCurrency(totals.subtotal, { currency })} />

        {totals.lineDiscountTotal > 0 ? (
          <Row
            label="Line discounts"
            value={`− ${formatCurrency(totals.lineDiscountTotal, { currency })}`}
            muted
          />
        ) : null}

        <div className="grid gap-2 pt-1">
          <Label htmlFor="doc-discount" className="text-[12px] text-muted-foreground">
            Document discount
          </Label>
          <div className="flex gap-2">
            <Select
              value={discountType}
              onValueChange={(value) =>
                onDiscountTypeChange(value as 'PERCENTAGE' | 'FIXED')
              }
            >
              <SelectTrigger size="sm" className="w-[6.5rem]" aria-label="Discount type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percent</SelectItem>
                <SelectItem value="FIXED">Fixed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="doc-discount"
              type="number"
              inputMode="decimal"
              min={0}
              max={discountType === 'PERCENTAGE' ? 100 : undefined}
              step="0.01"
              value={discountValue}
              onChange={(event) =>
                onDiscountValueChange(
                  event.target.value === '' ? 0 : Number(event.target.value),
                )
              }
              className="h-8 flex-1 text-right text-[13px] tabular"
            />
          </div>
          {totals.discountAmount > 0 ? (
            <p className="text-right text-[12px] text-muted-foreground tabular">
              − {formatCurrency(totals.discountAmount, { currency })}
            </p>
          ) : null}
        </div>

        <Row label={taxLabel} value={formatCurrency(totals.taxAmount, { currency })} />

        {withShipping && onShippingChange ? (
          <div className="grid gap-2 pt-1">
            <Label htmlFor="doc-shipping" className="text-[12px] text-muted-foreground">
              Shipping
            </Label>
            <Input
              id="doc-shipping"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={shippingAmount}
              onChange={(event) =>
                onShippingChange(
                  event.target.value === '' ? 0 : Number(event.target.value),
                )
              }
              className="h-8 text-right text-[13px] tabular"
            />
          </div>
        ) : null}
      </dl>

      <Separator className="my-4" />

      <div className="flex items-baseline justify-between">
        <span className="text-[13.5px] font-medium">Total</span>
        <span className="text-xl font-semibold tracking-[-0.02em] tabular">
          {formatCurrency(totals.total, { currency })}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={muted ? 'text-muted-foreground' : ''}>{label}</dt>
      <dd className={`tabular ${muted ? 'text-muted-foreground' : 'font-medium'}`}>
        {value}
      </dd>
    </div>
  );
}

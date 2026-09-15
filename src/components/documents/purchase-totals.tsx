'use client';

import { useWatch, type Control, type FieldValues } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { calculateDocumentTotals, formatCurrency } from '@/lib/money';

type PurchaseTotalsValues = {
  items: Array<{ quantity: number; unitPrice: number; taxRate: number }>;
  discountAmount?: number;
};

/**
 * Live totals for a supplier document.
 *
 * Separate from `TotalsPanel` because the shape of the discount differs rather
 * than only its presentation: a supplier gives you an amount off the invoice,
 * not a percentage you choose. Both panels total through
 * `calculateDocumentTotals`, so the figure on screen is what gets stored.
 */
export function PurchaseTotals<TFieldValues extends FieldValues & PurchaseTotalsValues>({
  control: outerControl,
  currency,
  taxLabel,
  onDiscountChange,
  readOnly = false,
}: {
  control: Control<TFieldValues>;
  currency: string;
  taxLabel: string;
  onDiscountChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  // See LineEditor: `Control` is invariant, so narrow once here.
  const control = outerControl as unknown as Control<PurchaseTotalsValues>;

  const items = useWatch({ control, name: 'items' }) ?? [];
  const discountAmount = useWatch({ control, name: 'discountAmount' }) ?? 0;

  const totals = calculateDocumentTotals({
    lines: items.map((item) => ({
      quantity: Number(item?.quantity) || 0,
      unitPrice: Number(item?.unitPrice) || 0,
      taxRate: Number(item?.taxRate) || 0,
    })),
    discountType: 'FIXED',
    discountValue: Number(discountAmount) || 0,
  });

  return (
    <div className="rounded-xl border border-border bg-surface-subtle p-5">
      <dl className="space-y-2.5 text-[13.5px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium tabular">
            {formatCurrency(totals.subtotal, { currency })}
          </dd>
        </div>

        {!readOnly && onDiscountChange ? (
          <div className="grid gap-2 pt-1">
            <Label htmlFor="po-discount" className="text-[12px] text-muted-foreground">
              Supplier discount
            </Label>
            <Input
              id="po-discount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={discountAmount}
              onChange={(event) =>
                onDiscountChange(
                  event.target.value === '' ? 0 : Number(event.target.value),
                )
              }
              className="h-8 text-right text-[13px] tabular"
            />
          </div>
        ) : totals.discountAmount > 0 ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Supplier discount</dt>
            <dd className="font-medium tabular">
              − {formatCurrency(totals.discountAmount, { currency })}
            </dd>
          </div>
        ) : null}

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{taxLabel}</dt>
          <dd className="font-medium tabular">
            {formatCurrency(totals.taxAmount, { currency })}
          </dd>
        </div>
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

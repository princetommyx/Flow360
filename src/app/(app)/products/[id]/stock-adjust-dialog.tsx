'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { FormStatus } from '@/components/shared/form-status';
import { adjustStockAction } from '@/server/actions/products';
import {
  stockAdjustmentSchema,
  type StockAdjustmentInput,
} from '@/lib/validations/product';
import { formatNumber, round } from '@/lib/money';
import { toDateInput } from '@/lib/date';

export function StockAdjustDialog({
  productId,
  productName,
  unit,
  currentStock,
  openByDefault = false,
}: {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  openByDefault?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(openByDefault);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId,
      type: 'STOCK_IN',
      quantity: 0,
      unitCost: null,
      reason: '',
      occurredAt: toDateInput(new Date()),
    },
  });

  const type = useWatch({ control: form.control, name: 'type' });
  const quantity = useWatch({ control: form.control, name: 'quantity' });

  // Mirrors the server's arithmetic so the outcome is visible before saving.
  const resulting =
    type === 'STOCK_IN'
      ? round(currentStock + quantity, 3)
      : type === 'STOCK_OUT'
        ? round(currentStock - quantity, 3)
        : round(quantity, 3);

  async function onSubmit(values: StockAdjustmentInput) {
    setError(null);
    const result = await adjustStockAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success('Stock updated', {
      description: `${productName} is now ${formatNumber(resulting, 0)} ${unit}.`,
    });
    setOpen(false);
    form.reset({
      productId,
      type: 'STOCK_IN',
      quantity: 0,
      unitCost: null,
      reason: '',
      occurredAt: toDateInput(new Date()),
    });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <PackagePlus /> Adjust stock
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {productName}. Currently {formatNumber(currentStock, 0)} {unit} on hand.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <DialogBody className="grid gap-4">
              <FormStatus error={error} />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Movement</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STOCK_IN">Stock in (received)</SelectItem>
                        <SelectItem value="STOCK_OUT">Stock out (used or written off)</SelectItem>
                        <SelectItem value="ADJUSTMENT">Correction (set counted total)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>
                        {type === 'ADJUSTMENT' ? 'Counted total' : 'Quantity'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          autoFocus
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Leaves {formatNumber(resulting, 0)} {unit} on hand.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occurredAt"
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
              </div>

              {type === 'STOCK_IN' ? (
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Optional"
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === '' ? null : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>Recorded against this movement for valuation.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Delivery from Kestrel Timber, damaged in transit, annual stocktake…"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Kept on the stock history permanently.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Record movement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

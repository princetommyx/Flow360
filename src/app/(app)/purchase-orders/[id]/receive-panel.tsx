'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import { receiveGoodsAction } from '@/server/actions/purchase-orders';
import { formatNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';

export type ReceivableLine = {
  id: string;
  name: string;
  unit: string;
  ordered: number;
  received: number;
  tracked: boolean;
};

/**
 * Booking a delivery in.
 *
 * The figures are cumulative totals rather than "how many arrived today", so
 * the screen always shows the true position and a correction is made by typing
 * the right number — not by working out a difference in your head.
 */
export function ReceivePanel({
  purchaseOrderId,
  lines,
}: {
  purchaseOrderId: string;
  lines: ReceivableLine[];
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [receivedAt, setReceivedAt] = React.useState(() => toDateInput(new Date()));
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(lines.map((line) => [line.id, String(line.received)])),
  );

  const changed = lines.some(
    (line) => (Number(values[line.id]) || 0) !== line.received,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await runAction(() =>
        receiveGoodsAction({
          purchaseOrderId,
          receivedAt,
          lines: lines.map((line) => ({
            itemId: line.id,
            receivedQuantity: Number(values[line.id]) || 0,
          })),
        }),
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success('Delivery recorded', {
        description: 'Tracked products have moved into stock.',
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card id="receive" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <PackageCheck className="size-4 text-muted-foreground" aria-hidden />
          Record a delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <FormStatus error={error} />

          <div className="grid gap-2 sm:max-w-[16rem]">
            <Label htmlFor="received-at">Date received</Label>
            <Input
              id="received-at"
              type="date"
              value={receivedAt}
              onChange={(event) => setReceivedAt(event.target.value)}
            />
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {lines.map((line) => {
              const value = Number(values[line.id]) || 0;
              const outstanding = Math.max(0, line.ordered - value);

              return (
                <li
                  key={line.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{line.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {formatNumber(line.ordered, 0)} {line.unit} ordered
                      {outstanding > 0
                        ? ` · ${formatNumber(outstanding, 0)} still to come`
                        : ' · all in'}
                      {line.tracked ? '' : ' · not stock-tracked'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`recv-${line.id}`} className="sr-only">
                      Received so far for {line.name}
                    </Label>
                    <Input
                      id={`recv-${line.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={line.ordered}
                      step="0.001"
                      value={values[line.id] ?? '0'}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [line.id]: event.target.value,
                        }))
                      }
                      className="h-9 w-24 text-right text-[13px] tabular"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          [line.id]: String(line.ordered),
                        }))
                      }
                    >
                      All
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-muted-foreground">
              Totals are what has arrived in all, not just today.
            </p>
            <Button type="submit" loading={pending} disabled={!changed}>
              Record delivery
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

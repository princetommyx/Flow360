'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import { changeCurrencyAction } from '@/server/actions/company';
import { formatCurrency } from '@/lib/money';
import { CURRENCIES } from '@/lib/config/countries';

/**
 * The currency switcher.
 *
 * Two operations wear the same name, and choosing the wrong one is expensive in
 * both directions, so the form makes you say which you mean and shows the
 * arithmetic on a figure you recognise before you commit.
 */
export function CurrencyCard({
  workspaceName,
  current,
  sample,
  isOwner,
}: {
  workspaceName: string;
  current: string;
  /** A real figure from these books, so the preview is recognisable. */
  sample: { label: string; amount: number } | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const [to, setTo] = React.useState('');
  const [mode, setMode] = React.useState<'relabel' | 'convert'>('convert');
  const [rate, setRate] = React.useState('1');
  const [confirmation, setConfirmation] = React.useState('');

  const parsedRate = Number(rate) || 0;
  const previewAmount =
    sample && mode === 'convert' ? sample.amount * parsedRate : (sample?.amount ?? 0);

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Currency</CardTitle>
          <CardDescription>
            This workspace keeps its books in {current}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[13.5px] text-muted-foreground">
            Only the workspace owner can change the currency.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[14px]">Currency</CardTitle>
        <CardDescription>
          This workspace keeps its books in <strong>{current}</strong>. Everything
          you record is in that currency: invoices, bills, wages and balances.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!open ? (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Change currency
          </Button>
        ) : (
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setPending(true);
              try {
                const result = await runAction(() =>
                  changeCurrencyAction({
                    to,
                    mode,
                    rate: mode === 'convert' ? parsedRate : 1,
                    confirmation,
                  }),
                );

                if (!result.ok) {
                  setError(result.error);
                  return;
                }

                toast.success(
                  result.data.mode === 'convert'
                    ? `Books converted to ${result.data.to}`
                    : `Books relabelled as ${result.data.to}`,
                  {
                    description:
                      result.data.mode === 'convert'
                        ? `Every figure was restated at ${result.data.rate}.`
                        : 'No figure was changed, only the label.',
                  },
                );
                setOpen(false);
                setConfirmation('');
                router.refresh();
              } finally {
                setPending(false);
              }
            }}
          >
            <FormStatus error={error} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="currency-to">New currency</Label>
                <Select value={to || undefined} onValueChange={setTo}>
                  <SelectTrigger id="currency-to">
                    <SelectValue placeholder="Choose a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.filter((currency) => currency.code !== current).map(
                      (currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} · {currency.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency-mode">What should happen to the figures</Label>
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(value as 'relabel' | 'convert')}
                >
                  <SelectTrigger id="currency-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="convert">Convert them at a rate</SelectItem>
                    <SelectItem value="relabel">
                      Leave them (the label was wrong)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === 'convert' ? (
                <div className="grid gap-2">
                  <Label htmlFor="currency-rate">
                    Rate: 1 {current} buys how many {to || '…'}
                  </Label>
                  <Input
                    id="currency-rate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.0001"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    className="tabular"
                  />
                </div>
              ) : null}
            </div>

            {sample ? (
              <div className="rounded-xl border border-border bg-surface-subtle p-4">
                <p className="text-[12px] text-muted-foreground">
                  {sample.label}, as it would read afterwards
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[15px] font-semibold tabular">
                  <span>{formatCurrency(sample.amount, { currency: current })}</span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  <span>
                    {formatCurrency(previewAmount, { currency: to || current })}
                  </span>
                </p>
              </div>
            ) : null}

            <Alert variant="warning">
              <TriangleAlert aria-hidden />
              <AlertDescription className="text-foreground">
                {mode === 'convert' ? (
                  <>
                    Every amount in this workspace will be multiplied by the rate and
                    the label changed. This restates your own books. It does not
                    change what was agreed with anyone, so an invoice raised for{' '}
                    {current} is still owed as it was written. There is no undo beyond
                    converting back.
                  </>
                ) : (
                  <>
                    No figure will change, only the label. Use this only when the
                    amounts were already in {to || 'the new currency'} and the
                    workspace was set up with the wrong one. If the figures really are{' '}
                    {current}, this makes every total in the workspace wrong.
                  </>
                )}
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="currency-confirm">
                Type <strong>{workspaceName}</strong> to confirm
              </Label>
              <Input
                id="currency-confirm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={workspaceName}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  setConfirmation('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                loading={pending}
                disabled={!to || confirmation.trim() !== workspaceName}
              >
                {mode === 'convert'
                  ? `Convert everything to ${to || '…'}`
                  : `Relabel as ${to || '…'}`}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

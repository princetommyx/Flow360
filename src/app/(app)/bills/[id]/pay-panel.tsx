'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import { recordBillPaymentAction } from '@/server/actions/bills';
import { formatCurrency } from '@/lib/money';
import { toDateInput } from '@/lib/date';

const METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function PayPanel({
  billId,
  outstanding,
  currency,
  accounts,
}: {
  billId: string;
  outstanding: number;
  currency: string;
  accounts: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [amount, setAmount] = React.useState(String(outstanding));
  const [method, setMethod] = React.useState<string>('BANK_TRANSFER');
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? '');
  const [paidAt, setPaidAt] = React.useState(() => toDateInput(new Date()));
  const [reference, setReference] = React.useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await runAction(() =>
        recordBillPaymentAction({
          billId,
          amount: Number(amount) || 0,
          method,
          accountId,
          paidAt,
          reference,
        }),
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success('Payment recorded', {
        description: 'The account balance and the ledger have both moved.',
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <Card id="pay" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-[14px]">Pay this bill</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13.5px] text-muted-foreground">
            You need at least one account before you can record a payment, so the
            money has somewhere to come from.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="pay" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <Wallet className="size-4 text-muted-foreground" aria-hidden />
          Pay this bill
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormStatus error={error} className="sm:col-span-2" />

          <div className="grid gap-2">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min={0.01}
              max={outstanding}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="tabular"
            />
            <p className="text-[12px] text-muted-foreground">
              {formatCurrency(outstanding, { currency })} outstanding
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-date">Date paid</Label>
            <Input
              id="pay-date"
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-account">Paid from</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="pay-account">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-method">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="pay-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="pay-reference">Reference</Label>
            <Input
              id="pay-reference"
              placeholder="Transfer reference or cheque number"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>

          <div className="sm:col-span-2 sm:justify-self-end">
            <Button type="submit" loading={pending} className="w-full sm:w-auto">
              Record payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

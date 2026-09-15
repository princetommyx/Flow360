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
import { payPayrollAction } from '@/server/actions/payroll';
import { formatCurrency } from '@/lib/money';
import { toDateInput } from '@/lib/date';

export function PayPayslip({
  payrollId,
  net,
  currency,
  accounts,
}: {
  payrollId: string;
  net: number;
  currency: string;
  accounts: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? '');
  const [paidAt, setPaidAt] = React.useState(() => toDateInput(new Date()));

  if (accounts.length === 0) {
    return (
      <Card id="pay" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-[14px]">Pay this payslip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13.5px] text-muted-foreground">
            You need at least one account before wages can be paid, so the money has
            somewhere to come from.
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
          Pay this payslip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setPending(true);
            try {
              const result = await runAction(() =>
                payPayrollAction(payrollId, { accountId, paidAt }),
              );
              if (!result.ok) {
                setError(result.error);
                return;
              }
              toast.success('Wages paid', {
                description: 'The account balance and the ledger have both moved.',
              });
              router.refresh();
            } finally {
              setPending(false);
            }
          }}
        >
          <FormStatus error={error} className="sm:col-span-2" />

          <div className="grid gap-2">
            <Label htmlFor="payslip-account">Paid from</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="payslip-account">
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
            <Label htmlFor="payslip-date">Date paid</Label>
            <Input
              id="payslip-date"
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="text-[13px] text-muted-foreground">
              {formatCurrency(net, { currency })} will leave the account.
            </p>
            <Button type="submit" loading={pending}>
              Pay {formatCurrency(net, { currency })}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

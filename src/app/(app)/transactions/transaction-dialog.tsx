'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
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
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import {
  createTransactionAction,
  updateTransactionAction,
} from '@/server/actions/transactions';
import {
  transactionSchema,
  type TransactionInput,
} from '@/lib/validations/transaction';
import { toDateInput } from '@/lib/date';

export type AccountChoice = { id: string; name: string };

export function TransactionDialog({
  open,
  onOpenChange,
  accounts,
  transactionId,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountChoice[];
  transactionId?: string;
  defaultValues?: Partial<TransactionInput>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {transactionId ? 'Edit ledger entry' : 'Record a movement'}
          </DialogTitle>
          <DialogDescription>
            Money that does not come from an invoice, a bill or an expense —
            takings, a bank charge, or moving funds between your own accounts.
          </DialogDescription>
        </DialogHeader>

        {/*
          Keyed on the row being edited so React builds a fresh form for each
          one. Resetting an existing form in an effect would mean rendering the
          previous row's figures first and correcting them a moment later.
        */}
        {open ? (
          <TransactionFields
            key={transactionId ?? 'new'}
            accounts={accounts}
            transactionId={transactionId}
            defaultValues={defaultValues}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TransactionFields({
  accounts,
  transactionId,
  defaultValues,
  onDone,
}: {
  accounts: AccountChoice[];
  transactionId?: string;
  defaultValues?: Partial<TransactionInput>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'INCOME',
      accountId: accounts[0]?.id ?? '',
      toAccountId: null,
      amount: 0,
      description: '',
      category: '',
      occurredAt: toDateInput(new Date()),
      reference: '',
      ...defaultValues,
    },
  });

  // `useWatch` rather than `form.watch`: the React Compiler cannot memoize the
  // latter safely, and only this one field decides what the form shows.
  const type = useWatch({ control: form.control, name: 'type' });

  async function submit(values: TransactionInput) {
    setError(null);
    const result = await runAction(() =>
      transactionId
        ? updateTransactionAction(transactionId, values)
        : createTransactionAction(values),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof TransactionInput, { message: result.error });
      }
      return;
    }

    toast.success(transactionId ? 'Entry updated' : 'Entry recorded');
    onDone();
    router.refresh();
  }

  return (
    <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4" noValidate>
            <FormStatus error={error} />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Kind</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      form.setValue('type', value as TransactionInput['type'], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INCOME">Money in</SelectItem>
                      <SelectItem value="EXPENSE">Money out</SelectItem>
                      <SelectItem value="TRANSFER">Transfer between accounts</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>
                      {type === 'TRANSFER' ? 'From account' : 'Account'}
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        form.setValue('accountId', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === 'TRANSFER' ? (
                <FormField
                  control={form.control}
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>To account</FormLabel>
                      <Select
                        value={field.value ?? undefined}
                        onValueChange={(value) =>
                          form.setValue('toAccountId', value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sales, Bank charges" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        className="tabular"
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === '' ? 0 : Number(event.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Always a positive figure — the kind decides the direction.
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>What was it</FormLabel>
                  <FormControl>
                    <Input placeholder="Counter takings, monthly bank fee…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Statement line or slip number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={form.formState.isSubmitting}>
            {transactionId ? 'Save changes' : 'Record it'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

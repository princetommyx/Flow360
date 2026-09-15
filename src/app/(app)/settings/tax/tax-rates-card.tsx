'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { FormStatus } from '@/components/shared/form-status';
import { SwitchRow } from '@/components/shared/switch-row';
import { runAction } from '@/lib/client-action';
import { deleteTaxRateAction, saveTaxRateAction } from '@/server/actions/settings';
import { taxRateSchema, type TaxRateInput } from '@/lib/validations/settings';
import type { TaxRateRow } from '@/server/services/settings';

const EMPTY: TaxRateInput = {
  name: '',
  rate: 0,
  isDefault: false,
  isCompound: false,
  isActive: true,
};

/**
 * The rate dialog is keyed on the row being edited, so opening it for a
 * different rate mounts a fresh form rather than resetting one in an effect.
 */
function RateDialog({
  rate,
  open,
  onOpenChange,
}: {
  rate: TaxRateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<TaxRateInput>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: rate
      ? {
          name: rate.name,
          rate: rate.rate,
          isDefault: rate.isDefault,
          isCompound: rate.isCompound,
          isActive: rate.isActive,
        }
      : EMPTY,
  });

  async function submit(values: TaxRateInput) {
    setError(null);
    const result = await runAction(() =>
      saveTaxRateAction(values, rate ? { id: rate.id } : undefined),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof TaxRateInput, { message: result.error });
      }
      return;
    }

    toast.success(rate ? 'Rate updated' : 'Rate added');
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{rate ? 'Edit rate' : 'Add a rate'}</DialogTitle>
          <DialogDescription>
            A rate you can pick on any quotation, invoice, bill or purchase line.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            <DialogBody className="grid gap-4">
              <FormStatus error={error} />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Standard VAT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.001"
                        inputMode="decimal"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={String(field.value ?? '')}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === '' ? '' : Number(event.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>Per cent.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SwitchRow
                        id="rate-default"
                        label="Use this one by default"
                        description="Only one rate can be the default. Turning this on takes it off whichever rate has it now."
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isCompound"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SwitchRow
                        id="rate-compound"
                        label="Compound"
                        description="Charged on the subtotal plus the tax already added, rather than on the subtotal alone."
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SwitchRow
                        id="rate-active"
                        label="Available to pick"
                        description="Retiring a rate keeps it on the documents that used it and takes it off the list for new ones."
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {rate ? 'Save rate' : 'Add rate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TaxRatesCard({
  rates,
  canEdit,
  taxLabel,
}: {
  rates: TaxRateRow[];
  canEdit: boolean;
  taxLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<TaxRateRow | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<TaxRateRow | null>(null);

  function open(rate: TaxRateRow | null) {
    setEditing(rate);
    setDialogOpen(true);
  }

  async function remove() {
    if (!removing) return;
    const result = await runAction(() => deleteTaxRateAction(removing.id));

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${removing.name} removed`);
    setRemoving(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-[14px]">{taxLabel} rates</CardTitle>
          <CardDescription>
            Everything that can be picked on a line. The default is applied first.
          </CardDescription>
        </div>
        {canEdit ? (
          <Button size="sm" variant="secondary" onClick={() => open(null)}>
            <Plus /> Add rate
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        {rates.length === 0 ? (
          <EmptyState
            title="No rates yet"
            description="Add the rates you charge so they can be picked on a line instead of typed each time."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {rates.map((rate) => (
              <li
                key={rate.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-medium">{rate.name}</span>
                    {rate.isDefault ? (
                      <Badge variant="default" size="sm">
                        Default
                      </Badge>
                    ) : null}
                    {rate.isCompound ? (
                      <Badge variant="outline" size="sm">
                        Compound
                      </Badge>
                    ) : null}
                    {!rate.isActive ? (
                      <Badge variant="neutral" size="sm">
                        Retired
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <span className="tabular mr-2 text-[13px] font-semibold">
                    {rate.rate}%
                  </span>
                  {canEdit ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${rate.name}`}
                        onClick={() => open(rate)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${rate.name}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoving(rate)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {dialogOpen ? (
        <RateDialog
          key={editing?.id ?? 'new'}
          rate={editing}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Remove ${removing?.name ?? 'this rate'}?`}
        description="Documents that already use it keep the rate they were issued with. It simply stops appearing in the list."
        confirmLabel="Remove rate"
        destructive
        onConfirm={remove}
      />
    </Card>
  );
}

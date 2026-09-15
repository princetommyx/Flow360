'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { FormStatus } from '@/components/shared/form-status';
import { SwitchRow } from '@/components/shared/switch-row';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { runAction } from '@/lib/client-action';
import { formatDocumentNumber } from '@/lib/document-number';
import { updateInvoicingAction } from '@/server/actions/settings';
import { invoicingSchema, type InvoicingInput } from '@/lib/validations/settings';

const PREFIXES: Array<{ name: keyof InvoicingInput; label: string }> = [
  { name: 'invoicePrefix', label: 'Invoices' },
  { name: 'quotationPrefix', label: 'Quotations' },
  { name: 'paymentPrefix', label: 'Payments' },
  { name: 'purchaseOrderPrefix', label: 'Purchase orders' },
];

export function InvoicingForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: InvoicingInput;
  canEdit: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<InvoicingInput>({
    resolver: zodResolver(invoicingSchema),
    defaultValues,
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const watched = useWatch({ control: form.control });

  // The preview is built with the allocator's own formatter, so what is shown
  // here is exactly what the next document will be called.
  const preview = formatDocumentNumber({
    prefix: (watched.invoicePrefix || 'INV').toUpperCase(),
    year: new Date().getFullYear(),
    serial: 1,
    padding: Math.min(Math.max(Number(watched.numberPadding) || 1, 1), 10),
    includeYear: watched.numberIncludeYear ?? true,
  });

  async function submit(values: InvoicingInput) {
    setError(null);
    const result = await runAction(() => updateInvoicingAction(values));

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof InvoicingInput, { message: result.error });
      }
      return;
    }

    toast.success('Invoicing settings saved');
    form.reset(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Numbering</CardTitle>
            <CardDescription>
              Numbers are allocated in order and never reused. Changing these affects
              the next document, not the ones already issued.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PREFIXES.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{item.label}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={!canEdit}
                          autoCapitalize="characters"
                          spellCheck={false}
                          {...field}
                          value={String(field.value ?? '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numberPadding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Digits in the counter</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        inputMode="numeric"
                        disabled={!canEdit}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={String(field.value ?? '')}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ''
                              ? ''
                              : Number(event.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Five digits counts to 99,999 before it grows a sixth.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-end">
                <p className="text-[12.5px] font-medium text-muted-foreground">
                  Your next invoice will be called
                </p>
                <p className="tabular mt-1.5 rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-[15px] font-semibold">
                  {preview}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="numberIncludeYear"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SwitchRow
                      id="number-include-year"
                      label="Put the year in the number"
                      description="The counter restarts each January when the year is included."
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Defaults on a new invoice</CardTitle>
            <CardDescription>
              Starting points, not rules. Any of them can be changed on the document
              itself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="defaultPaymentTermDays"
              render={({ field }) => (
                <FormItem className="sm:max-w-xs">
                  <FormLabel required>Payment terms</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      inputMode="numeric"
                      disabled={!canEdit}
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
                  <FormDescription>
                    Days from the issue date to the due date. Zero means due on receipt.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultInvoiceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      disabled={!canEdit}
                      placeholder="Anything you find yourself typing on most invoices."
                      {...field}
                      value={String(field.value ?? '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How to pay you</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      disabled={!canEdit}
                      placeholder="Bank name, account number, mobile money number."
                      {...field}
                      value={String(field.value ?? '')}
                    />
                  </FormControl>
                  <FormDescription>
                    Printed on the invoice under the totals.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceFooter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      disabled={!canEdit}
                      placeholder="Thank you for your business."
                      {...field}
                      value={String(field.value ?? '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {canEdit ? (
          <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
            <UnsavedChangesNotice show={isDirty} />
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={form.formState.isSubmitting}
            >
              Save changes
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}

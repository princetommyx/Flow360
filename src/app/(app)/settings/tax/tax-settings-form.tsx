'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { FormStatus } from '@/components/shared/form-status';
import { SwitchRow } from '@/components/shared/switch-row';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { runAction } from '@/lib/client-action';
import { updateTaxSettingsAction } from '@/server/actions/settings';
import {
  taxSettingsSchema,
  type TaxSettingsInput,
} from '@/lib/validations/settings';

export function TaxSettingsForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: TaxSettingsInput;
  canEdit: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<TaxSettingsInput>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues,
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function submit(values: TaxSettingsInput) {
    setError(null);
    const result = await runAction(() => updateTaxSettingsAction(values));

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof TaxSettingsInput, { message: result.error });
      }
      return;
    }

    toast.success('Tax settings saved');
    form.reset(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">How tax is shown</CardTitle>
            <CardDescription>
              Applies to new documents. Anything already issued keeps the wording and
              the rate it was issued with.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="taxLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>What you call it</FormLabel>
                    <FormControl>
                      <Input placeholder="VAT" disabled={!canEdit} {...field} />
                    </FormControl>
                    <FormDescription>
                      The label printed beside the tax line on every document.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultTaxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Default rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.001"
                        inputMode="decimal"
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
                      Per cent. Used on a new line before you pick anything else.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pricesIncludeTax"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SwitchRow
                      id="prices-include-tax"
                      label="Prices already include tax"
                      description="Tax is worked back out of the price rather than added on top. Turn this on if your catalogue is quoted at what the customer actually pays."
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

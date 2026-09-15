'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { runAction } from '@/lib/client-action';
import { updateCompanyAction } from '@/server/actions/company';
import { companySchema, type CompanyInput } from '@/lib/validations/company';

export function CompanyForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: CompanyInput;
  canEdit: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function submit(values: CompanyInput) {
    setError(null);
    const result = await runAction(() => updateCompanyAction(values));

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof CompanyInput, { message: result.error });
      }
      return;
    }

    toast.success('Company details saved');
    form.reset(values);
  }

  const field = (
    name: keyof CompanyInput,
    label: string,
    options?: { placeholder?: string; description?: string; type?: string },
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field: controlled }) => (
        <FormItem>
          <FormLabel required={name === 'name'}>{label}</FormLabel>
          <FormControl>
            <Input
              type={options?.type}
              placeholder={options?.placeholder}
              disabled={!canEdit}
              {...controlled}
            />
          </FormControl>
          {options?.description ? (
            <FormDescription>{options.description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">The business</CardTitle>
            <CardDescription>
              These details appear on your invoices, quotations and emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {field('name', 'Workspace name')}
            {field('legalName', 'Registered name', {
              description: 'If it differs from the trading name.',
            })}
            {field('email', 'Email', { type: 'email' })}
            {field('phone', 'Phone', { placeholder: '+233 24 123 4567' })}
            {field('website', 'Website', { placeholder: 'adwuma360.online' })}
            {field('taxId', 'Tax number', { description: 'Printed on invoices.' })}
            {field('industry', 'Industry', { placeholder: 'e.g. Manufacturing' })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {field('addressLine1', 'Address')}
            {field('addressLine2', 'Address line 2')}
            {field('city', 'City')}
            {field('state', 'Region')}
            {field('postalCode', 'Postal or digital address')}
            {field('country', 'Country')}
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

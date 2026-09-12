'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { createOrganizationAction } from '@/server/actions/organization';
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from '@/lib/validations/organization';
import { locale } from '@/lib/config/brand';

export function NewCompanyForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      email: '',
      currency: locale.currency,
      country: locale.country,
    },
  });

  async function onSubmit(values: CreateOrganizationInput) {
    setError(null);
    const result = await createOrganizationAction(values);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success(`${values.name} is ready`, {
      description: 'You are now working in the new company.',
    });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormStatus error={error} />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Company name</FormLabel>
              <FormControl>
                <Input placeholder="Harbour Fitouts Ltd." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="accounts@company.com" {...field} />
              </FormControl>
              <FormDescription>Shown on invoices and quotations.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Currency</FormLabel>
                <FormControl>
                  <Input placeholder="USD" maxLength={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Create company
          </Button>
        </div>
      </form>
    </Form>
  );
}

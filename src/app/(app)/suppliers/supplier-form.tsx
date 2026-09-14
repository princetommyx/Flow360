'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { PhoneField } from '@/components/shared/phone-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/shared/form-section';
import { FormStatus } from '@/components/shared/form-status';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { createSupplierAction, updateSupplierAction } from '@/server/actions/suppliers';
import { supplierSchema, type SupplierInput } from '@/lib/validations/supplier';
import { locale } from '@/lib/config/brand';

const EMPTY: SupplierInput = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  website: '',
  taxId: '',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  country: locale.country,
  paymentTermDays: 30,
  notes: '',
  status: 'ACTIVE',
};

export function SupplierForm({
  supplierId,
  defaultValues,
}: {
  supplierId?: string;
  defaultValues?: Partial<SupplierInput>;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function onSubmit(values: SupplierInput) {
    setError(null);
    const result = supplierId
      ? await updateSupplierAction(supplierId, values)
      : await createSupplierAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof SupplierInput, { message: result.error });
      }
      return;
    }

    toast.success(supplierId ? 'Supplier updated' : 'Supplier added');
    router.push(`/suppliers/${result.data.id}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardContent className="space-y-8 pt-6">
            <FormSection
              title="Identity"
              description="How this supplier appears on orders and bills."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl>
                        <Input placeholder="Meridian Timber Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Primary contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Kwesi Mensah" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="orders@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <PhoneField
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Blocked suppliers cannot be put on new orders or bills.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <Separator />

            <FormSection
              title="Address"
              description="Used on purchase orders and for your records."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street and number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City or town" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / region</FormLabel>
                      <FormControl>
                        <Input placeholder="State, region or province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal or ZIP code" {...field} />
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
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder={locale.country} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <Separator />

            <FormSection
              title="Trading terms"
              description="Defaults applied when you raise an order or record a bill."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="paymentTermDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Payment terms</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormDescription>
                        Days from the bill date until you owe them.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Internal notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Lead times, minimum orders, who to chase."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Never shown to the supplier.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={supplierId ? `/suppliers/${supplierId}` : '/suppliers'}>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              loading={form.formState.isSubmitting}
            >
              {supplierId ? 'Save changes' : 'Add supplier'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

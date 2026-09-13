'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { createCustomerAction, updateCustomerAction } from '@/server/actions/customers';
import { customerSchema, type CustomerInput } from '@/lib/validations/customer';
import { locale } from '@/lib/config/brand';

type CustomerFormProps = {
  customerId?: string;
  defaultValues?: Partial<CustomerInput>;
};

const EMPTY: CustomerInput = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  website: '',
  taxId: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: locale.country,
  creditLimit: null,
  paymentTermDays: 14,
  notes: '',
  tags: [],
  status: 'ACTIVE',
};

export function CustomerForm({ customerId, defaultValues }: CustomerFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [tagDraft, setTagDraft] = React.useState('');

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  const tags = useWatch({ control: form.control, name: 'tags' }) ?? [];

  function addTag() {
    const value = tagDraft.trim();
    if (!value || tags.includes(value) || tags.length >= 12) {
      setTagDraft('');
      return;
    }
    form.setValue('tags', [...tags, value], { shouldDirty: true });
    setTagDraft('');
  }

  async function onSubmit(values: CustomerInput) {
    setError(null);
    const result = customerId
      ? await updateCustomerAction(customerId, values)
      : await createCustomerAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof CustomerInput, { message: result.error });
      }
      return;
    }

    toast.success(customerId ? 'Customer updated' : 'Customer added');
    router.push(`/customers/${result.data.id}`);
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
              description="How this customer appears on quotations, invoices and statements."
            >
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lumen Health Group" {...field} />
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
                      <Input placeholder="Priya Raghavan" {...field} />
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
                      <Input type="email" placeholder="accounts@company.com" {...field} />
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
                      <Input type="tel" placeholder="+1 (415) 555-0121" {...field} />
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
                        <SelectItem value="BLOCKED">Blocked — no new sales</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <Separator />

            <FormSection
              title="Billing address"
              description="Printed on documents and used for tax purposes."
            >
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="2100 Folsom Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite 400" {...field} />
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
                      <Input placeholder="San Francisco" {...field} />
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
                      <Input placeholder="CA" {...field} />
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
                      <Input placeholder="94110" {...field} />
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
            </FormSection>

            <Separator />

            <FormSection
              title="Trading terms"
              description="Defaults applied when you raise a document for this customer."
            >
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
                      />
                    </FormControl>
                    <FormDescription>
                      Days from the invoice date to the due date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Optional"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === '' ? null : Number(event.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Shown as a warning when outstanding balance exceeds it.
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
                      <Input placeholder="US-338-221-904" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="sm:col-span-2">
                <FormLabel htmlFor="customer-tag">Tags</FormLabel>
                <div className="flex gap-2">
                  <Input
                    id="customer-tag"
                    value={tagDraft}
                    placeholder="healthcare, key account…"
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 ? (
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li key={tag}>
                        <Badge variant="neutral" className="gap-1 pr-1">
                          {tag}
                          <button
                            type="button"
                            aria-label={`Remove tag ${tag}`}
                            className="rounded-full p-0.5 transition-colors hover:bg-border"
                            onClick={() =>
                              form.setValue(
                                'tags',
                                tags.filter((value) => value !== tag),
                                { shouldDirty: true },
                              )
                            }
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </FormItem>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Internal notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Anything the team should know before quoting or chasing."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Never shown to the customer.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <UnsavedChangesNotice show={isDirty} />
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" asChild>
              <Link href={customerId ? `/customers/${customerId}` : '/customers'}>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
              loading={form.formState.isSubmitting}
            >
              {customerId ? 'Save changes' : 'Add customer'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import { COUNTRIES, DIAL_CODES, findCountry } from '@/lib/config/countries';
import { locale } from '@/lib/config/brand';
import { completeOnboardingAction } from '@/server/actions/onboarding';
import {
  onboardingSchema,
  type OnboardingInput,
} from '@/lib/validations/onboarding';

const DEFAULT_COUNTRY =
  findCountry(locale.countryCode) ?? COUNTRIES.find((c) => c.code === 'US')!;

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
      countryCode: DEFAULT_COUNTRY.code,
      dialCode: DEFAULT_COUNTRY.dialCode,
      phone: '',
      industry: '',
    },
  });

  /** Picking a country moves the dial code with it, which is nearly always right. */
  function applyCountry(code: string) {
    form.setValue('countryCode', code, { shouldDirty: true, shouldValidate: true });
    const country = findCountry(code);
    if (country) form.setValue('dialCode', country.dialCode, { shouldDirty: true });
  }

  const selected = findCountry(
    useWatch({ control: form.control, name: 'countryCode' }),
  );

  async function onSubmit(values: OnboardingInput) {
    setError(null);
    const result = await runAction(() => completeOnboardingAction(values));

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof OnboardingInput, { message: result.error });
      }
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 grid gap-4" noValidate>
        <FormStatus error={error} />

        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Business name</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  autoComplete="organization"
                  placeholder="Northwind Supply Co."
                  className="h-12 rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                What your customers see on invoices and quotations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Country</FormLabel>
              <FormControl>
                <Combobox
                  options={COUNTRIES.map((country) => ({
                    value: country.code,
                    label: country.name,
                    meta: country.currency,
                  }))}
                  value={field.value}
                  onChange={applyCountry}
                  placeholder="Choose a country…"
                  searchPlaceholder="Search countries…"
                  emptyMessage="No country matches that search."
                  className="h-12 rounded-xl"
                />
              </FormControl>
              <FormDescription>
                {selected
                  ? `Your books will be kept in ${selected.currency}. Changing it later converts every figure, so it is worth getting right now.`
                  : 'This sets the currency your books are kept in.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel htmlFor="onboarding-phone" required>
            Phone
          </FormLabel>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="dialCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className="h-12 w-[6.5rem] shrink-0 rounded-xl"
                    aria-label="Dial code"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAL_CODES.map((entry) => (
                      <SelectItem key={entry.dialCode} value={entry.dialCode}>
                        +{entry.dialCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <div className="flex-1">
                  <Input
                    id="onboarding-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="e.g. 24 123 4567"
                    className="h-12 rounded-xl"
                    aria-invalid={Boolean(form.formState.errors.phone)}
                    {...field}
                  />
                </div>
              )}
            />
          </div>
          <FormMessage>{form.formState.errors.phone?.message}</FormMessage>
        </FormItem>

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What line of work</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Furniture manufacturing"
                  className="h-12 rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional, and only ever used by us.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="xl"
          className="mt-2 w-full rounded-full"
          loading={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Setting things up…' : 'Create my workspace'}
          {form.formState.isSubmitting ? null : <ArrowRight />}
        </Button>
      </form>
    </Form>
  );
}

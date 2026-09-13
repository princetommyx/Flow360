'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
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
import { AuthDivider } from '@/components/shared/auth-divider';
import { FormStatus } from '@/components/shared/form-status';
import { GoogleButton } from '@/components/shared/google-button';
import { PasswordInput } from '@/components/shared/password-input';
import { registerAction } from '@/server/actions/auth';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { COUNTRIES, DIAL_CODES, findCountry } from '@/lib/config/countries';
import { locale } from '@/lib/config/brand';
import { cn } from '@/lib/utils';

const RULES = [
  { label: '10+ characters', test: (value: string) => value.length >= 10 },
  {
    label: 'Upper & lowercase',
    test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { label: 'A number', test: (value: string) => /[0-9]/.test(value) },
];

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const defaultCountry =
    findCountry(locale.countryCode) ?? COUNTRIES.find((c) => c.code === 'US')!;

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: '',
      countryCode: defaultCountry.code,
      dialCode: defaultCountry.dialCode,
      phone: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = useWatch({ control: form.control, name: 'password' }) ?? '';

  /** Choosing a country also sets the dial code, so the phone field follows. */
  function applyCountry(code: string) {
    form.setValue('countryCode', code, { shouldDirty: true, shouldValidate: true });
    const country = findCountry(code);
    if (country) {
      form.setValue('dialCode', country.dialCode, { shouldDirty: true });
    }
  }

  async function onSubmit(values: RegisterInput) {
    setError(null);
    const result = await registerAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof RegisterInput, { message: result.error });
      }
      return;
    }

    router.push(result.data.redirectTo);
    router.refresh();
  }

  return (
    <div className="mt-6">
      {googleEnabled ? (
        <>
          <GoogleButton />
          <AuthDivider />
        </>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={googleEnabled ? 'mt-5 grid gap-4' : 'grid gap-4'}
          noValidate
        >
          <FormStatus error={error} />

          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company / workspace name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="organization"
                    placeholder="e.g. Northwind Supply Co."
                    className="h-12 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel htmlFor="signup-phone">
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
                      id="signup-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="e.g. 712 345 678"
                      className="h-12 rounded-xl"
                      aria-invalid={Boolean(form.formState.errors.phone)}
                      {...field}
                    />
                  </div>
                )}
              />
            </div>
            {form.formState.errors.phone ? (
              <p className="text-[12px] font-medium text-destructive">
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </FormItem>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="e.g. Alex Moreno"
                    className="h-12 rounded-xl"
                    {...field}
                  />
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
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="e.g. you@company.com"
                    className="h-12 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="At least 10 characters"
                    className="h-12 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li
                        key={rule.label}
                        className={cn(
                          'flex items-center gap-1 text-[12px] transition-colors',
                          passed ? 'text-success' : 'text-muted-foreground',
                        )}
                      >
                        <Check
                          className={cn('size-3', passed ? 'opacity-100' : 'opacity-35')}
                          aria-hidden
                        />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="h-12 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="xl"
            className="mt-1 w-full rounded-full"
            loading={form.formState.isSubmitting}
          >
            Continue
          </Button>

          <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
            By proceeding you agree to our{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms &amp; Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </Form>
    </div>
  );
}

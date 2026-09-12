'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';

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
import { registerAction } from '@/server/actions/auth';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { brand } from '@/lib/config/brand';
import { cn } from '@/lib/utils';

const RULES = [
  { label: '10+ characters', test: (value: string) => value.length >= 10 },
  { label: 'Upper & lowercase', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: 'A number', test: (value: string) => /[0-9]/.test(value) },
];

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      organizationName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = useWatch({ control: form.control, name: 'password' });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    const result = await registerAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field === 'email') {
        form.setError('email', { message: result.error });
      }
      return;
    }

    router.push(result.data.redirectTo);
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
              <FormLabel required>Your name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Alex Moreno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Company name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="organization"
                  placeholder="Northwind Supply Co."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This becomes your first workspace — you can add more later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Work email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
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
              <FormLabel required>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  {...field}
                />
              </FormControl>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {RULES.map((rule) => {
                  const passed = rule.test(password ?? '');
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
              <FormLabel required>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          loading={form.formState.isSubmitting}
        >
          Create workspace
        </Button>

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          By continuing you agree to the {brand.name} terms of service and privacy policy.
        </p>
      </form>
    </Form>
  );
}

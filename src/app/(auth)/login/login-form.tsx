'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthDivider } from '@/components/shared/auth-divider';
import { FormStatus } from '@/components/shared/form-status';
import { GoogleButton } from '@/components/shared/google-button';
import { PasswordInput } from '@/components/shared/password-input';
import { loginAction } from '@/server/actions/auth';
import { runAction } from '@/lib/client-action';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  // Keeps the button busy until the dashboard has actually rendered, rather
  // than going idle the moment the sign-in request comes back.
  const [navigating, startNavigation] = React.useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const next = searchParams.get('next');

  async function onSubmit(values: LoginInput) {
    setError(null);
    const result = await runAction(() => loginAction(values));

    if (!result.ok) {
      setError(result.error);
      form.setValue('password', '');
      return;
    }

    toast.success('Signed in', { description: 'Taking you to your workspace…' });
    startNavigation(() => {
      router.push(next?.startsWith('/') ? next : result.data.redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="mt-7">
      {googleEnabled ? (
        <>
          <GoogleButton callbackUrl={next?.startsWith('/') ? next : '/dashboard'} />
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={`you@${'company.com'}`}
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
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-[12.5px] font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder="••••••••••"
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
            loading={form.formState.isSubmitting || navigating}
          >
            Sign in
          </Button>
        </form>
      </Form>
    </div>
  );
}

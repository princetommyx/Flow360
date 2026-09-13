'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/shared/password-input';
import { FormStatus } from '@/components/shared/form-status';
import { resetPasswordAction } from '@/server/actions/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setError(null);
    const result = await resetPasswordAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2200);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-success-soft text-success">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <p className="text-[15px] font-semibold">Password updated</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Taking you to sign in&hellip;
        </p>
        <Button asChild variant="secondary" className="mt-5 w-full rounded-full">
          <Link href="/login">Go now</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormStatus error={error} />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
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
          className="w-full rounded-full"
          loading={form.formState.isSubmitting}
        >
          Update password
        </Button>
      </form>
    </Form>
  );
}

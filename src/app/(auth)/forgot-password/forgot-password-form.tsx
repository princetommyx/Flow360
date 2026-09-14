'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck, MailX } from 'lucide-react';

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
import { FormStatus } from '@/components/shared/form-status';
import { forgotPasswordAction } from '@/server/actions/auth';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations/auth';

export function ForgotPasswordForm({
  /** False when no email provider is connected, so nothing is actually sent. */
  mailDelivered = true,
}: {
  mailDelivered?: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setError(null);
    const result = await forgotPasswordAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div
          className={
            mailDelivered
              ? 'mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-success-soft text-success'
              : 'mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-warning-soft text-warning-foreground'
          }
        >
          {mailDelivered ? (
            <MailCheck className="size-5" aria-hidden />
          ) : (
            <MailX className="size-5" aria-hidden />
          )}
        </div>
        <p className="text-[15px] font-semibold">
          {mailDelivered ? 'Check your inbox' : 'No email could be sent'}
        </p>
        {mailDelivered ? (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            If an account exists for{' '}
            <strong className="text-foreground">{sentTo}</strong>, a reset link is
            on its way. It expires in 60 minutes.
          </p>
        ) : (
          /* Telling someone to watch an inbox that will never receive anything
             leaves them locked out and waiting. Say so, and say what to do. */
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            This deployment has no email provider connected, so no reset link was
            sent to <strong className="text-foreground">{sentTo}</strong>. Ask
            whoever runs it to connect one, or to reset your password directly.
          </p>
        )}
        <Button
          variant="secondary"
          className="mt-5 w-full rounded-full"
          onClick={() => {
            setSentTo(null);
            form.reset();
          }}
        >
          Use a different email
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
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
          Send reset link
        </Button>
      </form>
    </Form>
  );
}

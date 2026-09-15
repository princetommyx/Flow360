'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/shared/password-input';
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import { changePasswordAction } from '@/server/actions/settings';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/lib/validations/auth';

const EMPTY: ChangePasswordInput = {
  currentPassword: '',
  password: '',
  confirmPassword: '',
};

export function PasswordForm() {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  async function submit(values: ChangePasswordInput) {
    setError(null);
    const result = await runAction(() => changePasswordAction(values));

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof ChangePasswordInput, {
          message: result.error,
        });
      }
      return;
    }

    toast.success('Password changed');
    form.reset(EMPTY);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Password</CardTitle>
            <CardDescription>
              Changing it signs out any reset link you were sent and leaves your other
              devices signed in.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormStatus error={error} className="sm:col-span-2" />

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 sm:max-w-sm">
                  <FormLabel required>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
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
                  <FormLabel required>New password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>
                    At least 10 characters, with a capital, a small letter and a number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            className="w-full sm:w-auto"
            loading={form.formState.isSubmitting}
          >
            Change password
          </Button>
        </div>
      </form>
    </Form>
  );
}

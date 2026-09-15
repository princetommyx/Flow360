'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { FormStatus } from '@/components/shared/form-status';
import { SwitchRow } from '@/components/shared/switch-row';
import {
  UnsavedChangesNotice,
  useUnsavedChangesWarning,
} from '@/components/shared/unsaved-changes';
import { runAction } from '@/lib/client-action';
import { updateNotificationSettingsAction } from '@/server/actions/settings';
import {
  notificationSettingsSchema,
  type NotificationSettingsInput,
} from '@/lib/validations/settings';

type Row = {
  name: keyof NotificationSettingsInput;
  label: string;
  description: string;
};

const MONEY: Row[] = [
  {
    name: 'notifyOnInvoicePaid',
    label: 'An invoice is paid',
    description: 'Raised when a payment settles an invoice in full.',
  },
  {
    name: 'notifyOnOverdue',
    label: 'An invoice or bill goes overdue',
    description: 'Raised the first time a document is read after its due date passes.',
  },
  {
    name: 'notifyOnQuoteAccepted',
    label: 'A quotation is accepted',
    description: 'Raised when a quotation is marked accepted, before it is converted.',
  },
];

const STOCK: Row[] = [
  {
    name: 'lowStockAlerts',
    label: 'Watch stock levels',
    description:
      'Compares each tracked item against its reorder point. Turning this off hides the low stock panel on the dashboard as well.',
  },
  {
    name: 'notifyOnLowStock',
    label: 'Notify when an item runs low',
    description: 'Raised once per item as it crosses its reorder point.',
  },
];

export function NotificationsForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: NotificationSettingsInput;
  canEdit: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<NotificationSettingsInput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues,
  });

  const isDirty = form.formState.isDirty && !form.formState.isSubmitSuccessful;
  useUnsavedChangesWarning(isDirty);

  async function submit(values: NotificationSettingsInput) {
    setError(null);
    const result = await runAction(() => updateNotificationSettingsAction(values));

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success('Notification settings saved');
    form.reset(values);
  }

  const row = (item: Row, disabled?: boolean) => (
    <FormField
      key={item.name}
      control={form.control}
      name={item.name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <SwitchRow
              id={item.name}
              label={item.label}
              description={item.description}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={!canEdit || disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  // Watching stock is what produces the figure the alert is about, so the
  // alert cannot be on while the watching is off.
  const watching = useWatch({ control: form.control, name: 'lowStockAlerts' });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormStatus error={error} />

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Money</CardTitle>
            <CardDescription>
              These appear in the notification centre for everyone whose role lets them
              see the document in question.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">{MONEY.map((item) => row(item))}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {row(STOCK[0])}
            {row(STOCK[1], !watching)}
          </CardContent>
        </Card>

        {canEdit ? (
          <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
            <UnsavedChangesNotice show={isDirty} />
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={form.formState.isSubmitting}
            >
              Save changes
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}

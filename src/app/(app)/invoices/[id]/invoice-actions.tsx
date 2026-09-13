'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Copy, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  cancelInvoiceAction,
  duplicateInvoiceAction,
  sendInvoiceAction,
} from '@/server/actions/invoices';

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  status,
  can,
}: {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  can: { edit: boolean; create: boolean };
}) {
  const router = useRouter();
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);

  const isDraft = status === 'DRAFT';
  const isCancelled = status === 'CANCELLED';

  async function send() {
    setPending('send');
    try {
      const result = await sendInvoiceAction(invoiceId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${invoiceNumber} sent`);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function duplicate() {
    setPending('duplicate');
    try {
      const result = await duplicateInvoiceAction(invoiceId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Copied to ${result.data.number}`);
      router.push(`/invoices/${result.data.id}/edit`);
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => window.open(`/invoices/${invoiceId}/print`, '_blank')}
      >
        <Printer /> Print / PDF
      </Button>

      {can.create ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={duplicate}
          loading={pending === 'duplicate'}
          disabled={pending !== null}
        >
          <Copy /> Duplicate
        </Button>
      ) : null}

      {can.edit && isDraft ? (
        <Button size="sm" onClick={send} loading={pending === 'send'} disabled={pending !== null}>
          <Send /> Send invoice
        </Button>
      ) : null}

      {can.edit && !isDraft && !isCancelled ? (
        <Button
          variant="destructive-outline"
          size="sm"
          onClick={() => setConfirmCancel(true)}
          disabled={pending !== null}
        >
          <Ban /> Cancel
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this invoice?"
        destructive
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        description={
          <>
            <strong className="text-foreground">{invoiceNumber}</strong> will be marked
            cancelled and its outstanding balance cleared. Any stock it took out returns
            to inventory. The record is kept.
          </>
        }
        onConfirm={async () => {
          const result = await cancelInvoiceAction(invoiceId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(`${invoiceNumber} cancelled`);
          router.refresh();
        }}
      />
    </>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Check, Copy, RotateCcw, Send, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  acceptQuotationAction,
  convertQuotationAction,
  duplicateQuotationAction,
  reopenQuotationAction,
  rejectQuotationAction,
  sendQuotationAction,
} from '@/server/actions/quotations';

export function QuotationActions({
  quotationId,
  quotationNumber,
  status,
  hasInvoice,
  can,
}: {
  quotationId: string;
  quotationNumber: string;
  status: string;
  hasInvoice: boolean;
  can: { edit: boolean; create: boolean; invoice: boolean };
}) {
  const router = useRouter();
  const [confirmConvert, setConfirmConvert] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);

  /** Every action here is the same shape: run it, report it, refresh. */
  async function run(
    key: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
    onDone?: () => void,
  ) {
    setPending(key);
    try {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? 'That did not work.');
        return;
      }
      toast.success(success);
      if (onDone) onDone();
      else router.refresh();
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <>
      {can.edit && status === 'DRAFT' ? (
        <Button
          size="sm"
          loading={pending === 'send'}
          disabled={busy}
          onClick={() =>
            run(
              'send',
              () => sendQuotationAction(quotationId),
              `${quotationNumber} sent`,
            )
          }
        >
          {pending === 'send' ? null : <Send />} Send
        </Button>
      ) : null}

      {can.edit && ['SENT', 'EXPIRED', 'REJECTED'].includes(status) ? (
        <Button
          size="sm"
          variant="success"
          loading={pending === 'accept'}
          disabled={busy}
          onClick={() =>
            run(
              'accept',
              () => acceptQuotationAction(quotationId),
              `${quotationNumber} marked accepted`,
            )
          }
        >
          {pending === 'accept' ? null : <Check />} Mark accepted
        </Button>
      ) : null}

      {can.invoice && status === 'ACCEPTED' && !hasInvoice ? (
        <Button size="sm" disabled={busy} onClick={() => setConfirmConvert(true)}>
          <ArrowRightLeft /> Convert to invoice
        </Button>
      ) : null}

      {can.edit && ['SENT', 'ACCEPTED'].includes(status) ? (
        <Button
          size="sm"
          variant="secondary"
          loading={pending === 'reject'}
          disabled={busy}
          onClick={() =>
            run(
              'reject',
              () => rejectQuotationAction(quotationId),
              `${quotationNumber} marked declined`,
            )
          }
        >
          {pending === 'reject' ? null : <X />} Declined
        </Button>
      ) : null}

      {can.edit && ['REJECTED', 'EXPIRED'].includes(status) ? (
        <Button
          size="sm"
          variant="secondary"
          loading={pending === 'reopen'}
          disabled={busy}
          onClick={() =>
            run(
              'reopen',
              () => reopenQuotationAction(quotationId),
              `${quotationNumber} reopened`,
            )
          }
        >
          {pending === 'reopen' ? null : <RotateCcw />} Reopen
        </Button>
      ) : null}

      {can.create ? (
        <Button
          size="sm"
          variant="secondary"
          loading={pending === 'duplicate'}
          disabled={busy}
          onClick={() =>
            run(
              'duplicate',
              async () => {
                const result = await duplicateQuotationAction(quotationId);
                if (result.ok) router.push(`/quotations/${result.data.id}/edit`);
                return result;
              },
              'Copied to a new draft',
              () => {},
            )
          }
        >
          {pending === 'duplicate' ? null : <Copy />} Duplicate
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title="Turn this into an invoice?"
        confirmLabel="Create the invoice"
        description={
          <>
            <strong className="text-foreground">{quotationNumber}</strong> will be
            copied into a new draft invoice with the same lines and totals. Nothing is
            sent and no stock moves until you send that invoice.
          </>
        }
        onConfirm={() =>
          run(
            'convert',
            async () => {
              const result = await convertQuotationAction(quotationId);
              if (result.ok) router.push(`/invoices/${result.data.invoiceId}`);
              return result;
            },
            'Invoice created from the quotation',
            () => {},
          )
        }
      />
    </>
  );
}

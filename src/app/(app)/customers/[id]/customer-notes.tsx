'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateCustomerNotesAction } from '@/server/actions/customers';

export function CustomerNotes({
  customerId,
  initialNotes,
  canEdit,
}: {
  customerId: string;
  initialNotes: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = React.useState(initialNotes);
  const [saving, setSaving] = React.useState(false);

  const dirty = notes !== initialNotes;

  async function save() {
    setSaving(true);
    try {
      const result = await updateCustomerNotesAction(customerId, notes);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Notes saved');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return notes ? (
      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{notes}</p>
    ) : (
      <p className="text-[13.5px] text-muted-foreground">
        No notes have been added for this customer.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={10}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Delivery preferences, who signs off purchase orders, payment behaviour…"
        aria-label="Internal notes"
      />
      <div className="flex items-center justify-end gap-3">
        {dirty ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotes(initialNotes)}
            disabled={saving}
          >
            Discard
          </Button>
        ) : null}
        <Button size="sm" onClick={save} disabled={!dirty} loading={saving}>
          Save notes
        </Button>
      </div>
    </div>
  );
}

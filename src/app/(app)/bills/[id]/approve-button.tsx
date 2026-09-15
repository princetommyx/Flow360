'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { runAction } from '@/lib/client-action';
import { approveBillAction } from '@/server/actions/bills';

/** Moves a draft bill into payables, where it starts counting towards what you owe. */
export function ApproveButton({ billId }: { billId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      size="sm"
      loading={pending}
      onClick={async () => {
        setPending(true);
        try {
          const result = await runAction(() => approveBillAction(billId));
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success('Approved for payment');
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      <Check /> Approve
    </Button>
  );
}

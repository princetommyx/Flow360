import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

/** Inline banner for form-level (not field-level) feedback. */
export function FormStatus({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;

  return (
    <Alert variant={error ? 'destructive' : 'success'} className="items-start">
      {error ? <AlertCircle aria-hidden /> : <CheckCircle2 aria-hidden />}
      <AlertDescription className="text-foreground">
        {error ?? success}
      </AlertDescription>
    </Alert>
  );
}

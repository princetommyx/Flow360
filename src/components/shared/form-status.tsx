import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/** Inline banner for form-level (not field-level) feedback. */
export function FormStatus({
  error,
  success,
  className,
}: {
  error?: string | null;
  success?: string | null;
  /** For placing the banner inside a grid that the form itself lays out. */
  className?: string;
}) {
  if (!error && !success) return null;

  return (
    <Alert variant={error ? 'destructive' : 'success'} className={cn('items-start', className)}>
      {error ? <AlertCircle aria-hidden /> : <CheckCircle2 aria-hidden />}
      <AlertDescription className="text-foreground">
        {error ?? success}
      </AlertDescription>
    </Alert>
  );
}

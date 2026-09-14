'use client';

import * as React from 'react';
import { toast } from 'sonner';

/**
 * The last resort for a failure nothing else caught.
 *
 * A server action that throws rejects whatever awaited it, and an unhandled
 * rejection is invisible: the button stops spinning and the screen does not
 * change, which reads as a dead control rather than as an error. Forms that
 * matter handle this themselves through `runAction`; this catches everything
 * else so no interaction in the product can fail in complete silence.
 *
 * It says only that something failed, because that is all the browser knows —
 * the reason exists in the server log, and guessing at it here would be worse
 * than admitting the limit.
 */
export function UnhandledErrorToast() {
  React.useEffect(() => {
    let lastShown = 0;

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason as
        | { name?: string; message?: string; digest?: string }
        | undefined;

      // Next.js signals redirect and not-found by throwing, and an aborted
      // fetch is how a cancelled navigation ends. Neither is a failure.
      const message = `${reason?.digest ?? ''} ${reason?.message ?? ''}`;
      if (reason?.name === 'AbortError' || /NEXT_(REDIRECT|NOT_FOUND)/.test(message)) {
        return;
      }

      // One listener can fire several times for the same interaction.
      const now = Date.now();
      if (now - lastShown < 4000) return;
      lastShown = now;

      toast.error('That did not go through', {
        description:
          navigator.onLine === false
            ? 'You appear to be offline. Check your connection and try again.'
            : 'Something went wrong at our end. Please try again in a moment.',
      });
    }

    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  return null;
}

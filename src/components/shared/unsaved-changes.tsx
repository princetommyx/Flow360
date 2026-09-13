'use client';

import * as React from 'react';

/**
 * Warns before the browser discards an in-progress form.
 *
 * Only the native beforeunload guard is used: intercepting App Router
 * navigation is not supported, so a fake dialog would give false assurance.
 */
export function useUnsavedChangesWarning(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}

/** Inline reminder that a form has edits waiting to be saved. */
export function UnsavedChangesNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="text-[12.5px] text-muted-foreground" role="status">
      You have unsaved changes.
    </p>
  );
}

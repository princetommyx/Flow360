'use client';

import * as React from 'react';

import { formatRelative } from '@/lib/date';

/**
 * "20 minutes ago", without the hydration mismatch.
 *
 * A relative time is computed from the clock, and the clock has moved between
 * the server rendering the HTML and the browser hydrating it. React is right
 * to complain about that in general, so this says plainly that the difference
 * is expected. The interval then keeps the label current while the page is
 * open, rather than letting it go stale in front of the reader.
 */
export function TimeAgo({
  value,
  className,
}: {
  value: string | Date;
  className?: string;
}) {
  const iso = typeof value === 'string' ? value : value.toISOString();

  // The first client render recomputes from the browser's own clock, so the
  // label is already right by the time the effect runs; the effect only keeps
  // it right.
  const [label, setLabel] = React.useState(() => formatRelative(iso));

  // A refreshed list can hand the same mounted component a different instant.
  // Adjusting during render is React's own answer to that: waiting for the
  // interval would leave the wrong time on screen for up to a minute.
  const [renderedIso, setRenderedIso] = React.useState(iso);
  if (renderedIso !== iso) {
    setRenderedIso(iso);
    setLabel(formatRelative(iso));
  }

  React.useEffect(() => {
    const timer = setInterval(() => setLabel(formatRelative(iso)), 60_000);
    return () => clearInterval(timer);
  }, [iso]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}

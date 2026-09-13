'use client';

import * as React from 'react';

import { formatCurrency, formatNumber } from '@/lib/money';

type CountUpProps = {
  value: number;
  /** How the running value is rendered on each frame. */
  kind?: 'currency' | 'number' | 'percent';
  currency?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
};

/**
 * Counts a figure up to its value the first time it is seen.
 *
 * Two things matter more than the effect itself:
 *
 * - It always lands exactly on `value`. The final frame is assigned rather
 *   than interpolated, so a number can never settle a cent short.
 * - Assistive technology is given the final figure immediately. The animated
 *   text is `aria-hidden` and a visually hidden span carries the real value,
 *   so a screen reader never announces a partial number.
 */
export function CountUp({
  value,
  kind = 'number',
  currency,
  decimals = 0,
  durationMs = 900,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  // Starts at the real figure so the server-rendered markup (and anyone
  // without JavaScript) shows the true number. The count only rewinds to zero
  // once the element scrolls into view, which the reader has not seen yet.
  const [display, setDisplay] = React.useState(value);

  const format = React.useCallback(
    (input: number) => {
      if (kind === 'currency') return formatCurrency(input, { currency });
      if (kind === 'percent') return `${formatNumber(input, decimals)}%`;
      return formatNumber(input, decimals);
    },
    [kind, currency, decimals],
  );

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // Nothing to animate, or the reader has asked us not to — the figure is
    // already showing its final value, so there is nothing to do.
    if (prefersReduced || value === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    let frame = 0;
    let cancelled = false;

    const run = () => {
      setDisplay(0);
      const start = performance.now();

      const step = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - start) / durationMs);
        // Ease-out cubic: quick off the mark, settling gently.
        const eased = 1 - Math.pow(1 - progress, 3);

        if (progress >= 1) {
          setDisplay(value); // land exactly, never on an interpolated value
          return;
        }

        setDisplay(value * eased);
        frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            run();
          }
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

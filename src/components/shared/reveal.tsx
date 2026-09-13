'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Reveals its children the first time they scroll into view.
 *
 * Marketing sections only — application screens animate on mount instead, since
 * the reader is already looking at them and a scroll-triggered delay there
 * would just feel sluggish.
 *
 * Falls back to showing content immediately when IntersectionObserver is
 * unavailable or the reader has asked for reduced motion, so nothing can be
 * left permanently invisible.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!element || prefersReduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      // Start a little before the element reaches the viewport so the motion
      // has finished by the time it is properly in view.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // The element type is chosen by the caller, so the ref is widened to the
      // common base rather than being typed per tag.
      ref={ref as React.Ref<never>}
      data-shown={shown}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        !shown && 'reveal-pending',
        shown && 'motion-safe:animate-rise',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Top-of-page progress bar for navigations.
 *
 * App Router exposes no router events, so this starts on a same-document link
 * click and completes when the pathname or query actually changes. The bar
 * eases toward 90% and only jumps to 100% on arrival, so a slow page never
 * looks stalled and a fast one never flashes a full bar.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [active, setActive] = React.useState(false);
  const [value, setValue] = React.useState(0);

  // Completing a navigation is derived during render rather than in an effect,
  // which would cost an extra pass on every route change.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [lastRouteKey, setLastRouteKey] = React.useState(routeKey);
  if (routeKey !== lastRouteKey) {
    setLastRouteKey(routeKey);
    if (active) {
      setValue(100);
      setActive(false);
    }
  }

  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      // Ignore anything the browser will handle itself.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or only a hash change — nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      setValue(8);
      setActive(true);
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  // Creep toward 90% while the next page is being prepared.
  React.useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setValue((current) => (current >= 90 ? current : current + (90 - current) * 0.18));
    }, 180);

    // A navigation that never resolves must not leave the bar on screen.
    const bailout = setTimeout(() => setActive(false), 15_000);

    return () => {
      clearInterval(timer);
      clearTimeout(bailout);
    };
  }, [active]);

  // Fade the finished bar out rather than snapping it away.
  React.useEffect(() => {
    if (active || value === 0) return;
    const timer = setTimeout(() => setValue(0), 320);
    return () => clearTimeout(timer);
  }, [active, value]);

  const visible = active || value > 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      // Progress is decoration here: the destination page announces itself.
    >
      <div
        className="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${value}%`,
          opacity: visible ? 1 : 0,
          boxShadow: visible ? '0 0 8px var(--brand-primary)' : undefined,
        }}
      />
    </div>
  );
}

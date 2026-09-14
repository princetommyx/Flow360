'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/layout/theme-provider';
import { cn } from '@/lib/utils';

/**
 * Standalone appearance toggle, used where there is no account menu.
 *
 * `floating` sits over artwork and needs its own surface to stay visible on
 * both a dark backdrop and a light sheet. `inline` belongs in a toolbar, where
 * a border and a shadow would read as a stray control.
 */
export function ThemeToggle({
  className,
  variant = 'floating',
}: {
  className?: string;
  variant?: 'floating' | 'inline';
}) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      /*
        Which icon shows is decided by CSS, not by reading the theme during
        render. The server has no idea which theme the visitor has chosen, so
        branching here made the server send one icon and the client hydrate
        another — a hydration mismatch that React reported and recovered from
        by throwing the subtree away. Both icons are rendered and the `dark`
        class picks one, which is also correct before hydration.
      */
      aria-label="Switch between light and dark appearance"
      className={cn(
        'inline-flex items-center justify-center rounded-full text-foreground transition-colors motion-safe:active:scale-95',
        variant === 'floating'
          ? 'size-10 border border-border bg-surface/90 shadow-md backdrop-blur-md hover:bg-surface'
          : 'size-9 text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}

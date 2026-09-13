'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/layout/theme-provider';
import { cn } from '@/lib/utils';

/** Standalone appearance toggle, used where there is no account menu. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
      className={cn(
        // Sits over both the dark backdrop and the light sheet, so it uses a
        // surface fill rather than a translucent white that disappears on one.
        'inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-surface motion-safe:active:scale-95',
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

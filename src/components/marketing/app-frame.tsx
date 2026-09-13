import Image from 'next/image';

import { cn } from '@/lib/utils';

/**
 * Presents a real product screenshot inside a neutral window chrome.
 *
 * Deliberately understated — the chrome should frame the screenshot, not
 * compete with it, so the interface itself is what the reader looks at.
 */
export function AppFrame({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface shadow-xl',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-3 py-2.5">
        <span className="size-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="size-2.5 rounded-full bg-border-strong" aria-hidden />
        <span className="size-2.5 rounded-full bg-border-strong" aria-hidden />
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1100px"
        className="block h-auto w-full"
      />
    </figure>
  );
}

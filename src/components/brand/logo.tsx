import Image from 'next/image';

import { brand } from '@/lib/config/brand';
import { cn } from '@/lib/utils';

type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * Default logomark: three ascending bars inside a rounded tile, drawn with the
 * brand hues. Swap it wholesale by setting `NEXT_PUBLIC_BRAND_LOGO`.
 */
export function LogoMark({ size = 32, className }: LogoProps) {
  if (brand.logoUrl) {
    return (
      <Image
        src={brand.logoUrl}
        alt=""
        width={size}
        height={size}
        className={cn('rounded-lg object-contain', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width={size * 0.62}
        height={size * 0.62}
        role="presentation"
      >
        <rect x="3" y="13" width="4" height="8" rx="1.4" fill="currentColor" opacity="0.55" />
        <rect x="10" y="8.5" width="4" height="12.5" rx="1.4" fill="currentColor" opacity="0.8" />
        <rect x="17" y="3" width="4" height="18" rx="1.4" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({
  size = 32,
  className,
  textClassName,
  showText = true,
}: LogoProps & { textClassName?: string; showText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showText ? (
        <span
          className={cn(
            'text-[15px] font-semibold tracking-[-0.02em] text-foreground',
            textClassName,
          )}
        >
          {brand.name}
        </span>
      ) : null}
    </span>
  );
}

import Image from 'next/image';

import { brand } from '@/lib/config/brand';
import { cn } from '@/lib/utils';

type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * Default logomark: a continuous loop drawn as two offset arcs with a leading
 * dot — the cycle a record travels through (quote, invoice, payment, ledger).
 * Swap it wholesale by setting `NEXT_PUBLIC_BRAND_LOGO`.
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
        'inline-flex shrink-0 items-center justify-center rounded-[10px] bg-brand text-brand-foreground shadow-sm',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width={size * 0.66}
        height={size * 0.66}
        role="presentation"
      >
        {/* Outer arc — open at the top right, where the flow re-enters */}
        <path
          d="M19.5 8.2A8.5 8.5 0 1 0 20.5 12"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* Inner arc — the shorter return leg */}
        <path
          d="M7.4 14.6A5 5 0 0 1 15.2 9.2"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Leading dot */}
        <circle cx="19.6" cy="5.6" r="2.1" fill="currentColor" />
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

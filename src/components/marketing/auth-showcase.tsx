import Image from 'next/image';

import { brand } from '@/lib/config/brand';

/**
 * Brand panel beside the auth form.
 *
 * Shows a real screenshot of the product, tilted and bleeding off the panel so
 * it reads as a device rather than a flat image. Hidden below `lg`, where the
 * form should own the whole screen.
 */
export function AuthShowcase({
  headline,
  sub,
}: {
  headline: string;
  sub?: string;
}) {
  return (
    <aside className="relative hidden overflow-hidden rounded-xl bg-brand text-brand-foreground lg:block">
      <div
        className="absolute -right-24 -top-24 size-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'var(--brand-secondary)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
        aria-hidden
      />

      <div className="relative z-10 px-10 pt-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] opacity-70">
          {brand.name}
        </p>
        <h2 className="mt-4 max-w-[16ch] text-balance text-[1.9rem] font-semibold leading-[1.15] tracking-[-0.025em]">
          {headline}
        </h2>
        {sub ? (
          <p className="mt-3 max-w-[34ch] text-pretty text-[14px] leading-relaxed opacity-75">
            {sub}
          </p>
        ) : null}
      </div>

      {/* Tilted device, deliberately cropped by the panel edge */}
      <div
        className="pointer-events-none absolute -bottom-10 -right-16 w-[38rem] select-none"
        style={{ transform: 'rotate(-14deg)' }}
        aria-hidden
      >
        <div className="overflow-hidden rounded-2xl border border-white/15 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.55)]">
          <Image
            src="/product/dashboard.png"
            alt=""
            width={2800}
            height={1760}
            sizes="38rem"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </aside>
  );
}

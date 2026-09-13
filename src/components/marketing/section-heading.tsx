import { cn } from '@/lib/utils';

/** Eyebrow + headline + optional lead, used to open every marketing section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

import { cn } from '@/lib/utils';

/** Titled block inside a long form, so fields group into readable sections. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('grid gap-5 lg:grid-cols-[16rem_1fr] lg:gap-8', className)}>
      <div>
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h2>
        {description ? (
          <p className="mt-1 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

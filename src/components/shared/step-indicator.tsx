import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export type Step = { label: string };

/**
 * Numbered progress across a multi-step flow.
 *
 * Steps are announced as an ordered list with the current one marked, so the
 * position is available to assistive technology and not carried by colour.
 */
export function StepIndicator({
  steps,
  current,
  className,
}: {
  steps: ReadonlyArray<Step>;
  /** 1-based index of the active step. */
  current: number;
  className?: string;
}) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const position = index + 1;
          const done = position < current;
          const active = position === current;

          return (
            <li
              key={step.label}
              className={cn('flex items-start', index > 0 && 'flex-1')}
              aria-current={active ? 'step' : undefined}
            >
              {index > 0 ? (
                <span
                  className={cn(
                    'mt-[0.9rem] h-px flex-1 transition-colors',
                    done ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}

              <span className="flex items-start gap-2 px-2 first:pl-0">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors',
                    done
                      ? 'bg-primary text-primary-foreground'
                      : active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : position}
                </span>
                <span
                  className={cn(
                    'max-w-[5.5rem] text-[12.5px] font-medium leading-tight',
                    active || done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {done ? ' (completed)' : active ? ' (current step)' : ''}
                  </span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

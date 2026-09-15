'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * A labelled switch on its own line.
 *
 * Settings pages are mostly this shape, and a shared row keeps the label tied
 * to the control: the whole block is the label, so the text is a hit target
 * rather than decoration beside one.
 */
export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-subtle px-4 py-3',
        disabled && 'opacity-70',
        className,
      )}
    >
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={cn(
            'text-[13px] font-medium leading-none',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
        {description ? (
          <p className="mt-1.5 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

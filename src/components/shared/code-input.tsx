'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A segmented one-time-code field.
 *
 * One box per digit, because that is what a confirmation code looks like
 * everywhere else and it makes a mistyped digit obvious. The whole value is
 * still owned by the parent — the boxes are a presentation of one string, not
 * six pieces of state that could disagree with each other.
 *
 * `autoComplete="one-time-code"` on the first box lets iOS and Android offer
 * the code from the notification, so most people never type it at all.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus,
  label = 'Confirmation code',
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  label?: string;
}) {
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  const digits = React.useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ''),
    [value, length],
  );

  function focusBox(index: number) {
    inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  }

  function commit(next: string, caret: number) {
    const cleaned = next.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    focusBox(caret);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  function handleChange(index: number, raw: string) {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;

    // Typing over a filled box replaces that digit; a paste into one box
    // spills into the boxes after it rather than being truncated.
    const next = (
      value.slice(0, index) +
      typed +
      value.slice(index + typed.length)
    ).slice(0, length);

    commit(next, index + typed.length);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) {
        commit(value.slice(0, index) + value.slice(index + 1), index);
      } else {
        commit(value.slice(0, index - 1) + value.slice(index), index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    commit(pasted.slice(0, length), Math.min(pasted.length, length - 1));
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-2"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          // Each box takes one digit, but a paste arrives whole and is spread
          // across them by the handler above.
          maxLength={length}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-14 w-full min-w-0 rounded-xl border bg-surface text-center text-[22px] font-semibold tabular-nums',
            'outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25',
            'disabled:cursor-not-allowed disabled:opacity-60',
            invalid ? 'border-destructive' : 'border-input',
          )}
        />
      ))}
    </div>
  );
}

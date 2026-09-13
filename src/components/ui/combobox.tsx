'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  /** Right-aligned hint, e.g. a price or stock level. */
  meta?: string;
  disabled?: boolean;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Renders a "create" row when the search finds nothing. */
  onCreate?: (term: string) => void;
  createLabel?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-invalid'?: boolean;
};

/** Searchable single-select, used wherever a picker has more than ~10 options. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches found.',
  onCreate,
  createLabel = 'Create',
  disabled,
  className,
  id,
  ...rest
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState('');

  const selected = options.find((option) => option.value === value);

  const filtered = React.useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query) ||
        option.meta?.toLowerCase().includes(query),
    );
  }, [options, term]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between px-3 font-normal',
            !selected && 'text-muted-foreground/80',
            rest['aria-invalid'] && 'border-destructive ring-2 ring-destructive/20',
            className,
          )}
          {...rest}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>
                <span className="block">{emptyMessage}</span>
                {onCreate && term.trim() ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      onCreate(term.trim());
                      setOpen(false);
                      setTerm('');
                    }}
                  >
                    <Plus /> {createLabel} &ldquo;{term.trim()}&rdquo;
                  </Button>
                ) : null}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setTerm('');
                    }}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        'size-3.5 shrink-0 text-primary',
                        option.value === value ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {option.meta ? (
                      <span className="shrink-0 text-[12px] text-muted-foreground tabular">
                        {option.meta}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

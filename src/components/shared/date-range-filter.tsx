'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarRange } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DATE_RANGE_LABELS,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
} from '@/lib/date';
import { buildQueryString } from '@/lib/query';

/** Period selector shared by the dashboard and every report. */
export function DateRangeFilter({ preset }: { preset: DateRangePreset }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState(searchParams.get('from') ?? '');
  const [to, setTo] = React.useState(searchParams.get('to') ?? '');

  const push = (changes: Record<string, string | null>) => {
    router.push(`${pathname}${buildQueryString(searchParams, changes)}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={preset}
        onValueChange={(value) => {
          if (value === 'custom') {
            setOpen(true);
            return;
          }
          push({ period: value, from: null, to: null });
        }}
      >
        <SelectTrigger className="w-[9.5rem]" aria-label="Date range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {DATE_RANGE_PRESETS.map((option) => (
            <SelectItem key={option} value={option}>
              {DATE_RANGE_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="Set a custom range">
            <CalendarRange />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[17rem]">
          <p className="mb-3 text-[13px] font-semibold">Custom range</p>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="range-from">From</Label>
              <Input
                id="range-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="range-to">To</Label>
              <Input
                id="range-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
            <Button
              disabled={!from || !to}
              onClick={() => {
                push({ period: 'custom', from, to });
                setOpen(false);
              }}
            >
              Apply range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

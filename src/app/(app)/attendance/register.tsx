'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarCheck, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { runAction } from '@/lib/client-action';
import {
  clearAttendanceAction,
  markAllPresentAction,
  saveAttendanceAction,
} from '@/server/actions/attendance';
import { formatNumber } from '@/lib/money';
import type { RegisterRow } from '@/server/services/attendance';

const STATUS_LABELS = {
  PRESENT: 'Present',
  LATE: 'Late',
  HALF_DAY: 'Half day',
  ABSENT: 'Absent',
  LEAVE: 'On leave',
  HOLIDAY: 'Holiday',
} as const;

type Status = keyof typeof STATUS_LABELS;

/**
 * The daily register.
 *
 * One row per person on the books, whether or not anything has been recorded
 * for them — an unmarked day is the normal starting state, and the whole point
 * of the screen is to see who is still missing from it.
 */
export function Register({
  date,
  rows,
  canEdit,
}: {
  date: string;
  rows: RegisterRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = React.useState<string | null>(null);

  function setDate(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', next);
    router.push(`/attendance?${params.toString()}`);
  }

  async function save(row: RegisterRow, patch: Partial<RegisterRow>) {
    setBusy(row.employeeId);
    try {
      const result = await runAction(() =>
        saveAttendanceAction({
          employeeId: row.employeeId,
          date,
          status: patch.status ?? row.status ?? 'PRESENT',
          checkIn: patch.checkIn ?? row.checkIn ?? '',
          checkOut: patch.checkOut ?? row.checkOut ?? '',
          hoursWorked: patch.hoursWorked ?? row.hoursWorked,
          notes: row.notes ?? '',
        }),
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function clear(row: RegisterRow) {
    setBusy(row.employeeId);
    try {
      const result = await runAction(() =>
        clearAttendanceAction(row.employeeId, date),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Cleared ${row.name}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const unmarked = rows.filter((row) => row.status === null).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="register-date">Day</Label>
            <Input
              id="register-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-[11rem]"
            />
          </div>

          {canEdit && unmarked > 0 ? (
            <Button
              variant="secondary"
              onClick={async () => {
                setBusy('all');
                try {
                  const result = await runAction(() => markAllPresentAction(date));
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(
                    `${result.data.marked} marked present`,
                    { description: 'Anyone already marked was left alone.' },
                  );
                  router.refresh();
                } finally {
                  setBusy(null);
                }
              }}
              loading={busy === 'all'}
            >
              <Check /> Mark the remaining {unmarked} present
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nobody to mark"
          description="Attendance is recorded against the people on your team, so add someone first."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li
                  key={row.employeeId}
                  className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_9rem_7rem_7rem_6rem_2.5rem] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-medium">
                        {row.name}
                      </span>
                      {row.status === null ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Not marked
                        </span>
                      ) : (
                        <StatusBadge status={row.status} size="sm" />
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {row.position ?? row.employeeNumber}
                    </p>
                  </div>

                  <Select
                    value={row.status ?? undefined}
                    disabled={!canEdit || busy === row.employeeId}
                    onValueChange={(value) => save(row, { status: value as Status })}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={`Attendance for ${row.name}`}
                    >
                      <SelectValue placeholder="Mark…" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`in-${row.employeeId}`} className="sr-only">
                      Start time for {row.name}
                    </Label>
                    <Input
                      id={`in-${row.employeeId}`}
                      type="time"
                      defaultValue={row.checkIn ?? ''}
                      disabled={!canEdit || busy === row.employeeId}
                      onBlur={(event) => {
                        if ((event.target.value || '') === (row.checkIn ?? '')) return;
                        void save(row, { checkIn: event.target.value });
                      }}
                      className="h-8 text-[12.5px] tabular"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`out-${row.employeeId}`} className="sr-only">
                      Finish time for {row.name}
                    </Label>
                    <Input
                      id={`out-${row.employeeId}`}
                      type="time"
                      defaultValue={row.checkOut ?? ''}
                      disabled={!canEdit || busy === row.employeeId}
                      onBlur={(event) => {
                        if ((event.target.value || '') === (row.checkOut ?? '')) return;
                        void save(row, { checkOut: event.target.value });
                      }}
                      className="h-8 text-[12.5px] tabular"
                    />
                  </div>

                  <span className="text-[12.5px] tabular text-muted-foreground lg:text-right">
                    {row.hoursWorked > 0
                      ? `${formatNumber(row.hoursWorked, 2)} h`
                      : '—'}
                  </span>

                  <div className="flex justify-end">
                    {canEdit && row.attendanceId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Clear the record for ${row.name}`}
                        onClick={() => clear(row)}
                        disabled={busy === row.employeeId}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

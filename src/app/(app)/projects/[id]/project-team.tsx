'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { runAction } from '@/lib/client-action';
import {
  addProjectMemberAction,
  removeProjectMemberAction,
} from '@/server/actions/projects';
import { formatCurrency } from '@/lib/money';

type Member = {
  id: string;
  employeeId: string;
  name: string;
  position: string | null;
  role: string;
  hourlyRate: number | null;
};

export function ProjectTeam({
  projectId,
  members,
  available,
  currency,
  canEdit,
}: {
  projectId: string;
  members: Member[];
  available: Array<{ id: string; name: string }>;
  currency: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);
  const [employeeId, setEmployeeId] = React.useState('');
  const [role, setRole] = React.useState('Contributor');
  const [rate, setRate] = React.useState('');

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-[14px]">Team</CardTitle>
        {canEdit && available.length > 0 && !adding ? (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {members.length === 0 && !adding ? (
          <p className="text-[13.5px] text-muted-foreground">
            Nobody assigned yet.
          </p>
        ) : null}

        {members.length > 0 ? (
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-2 py-2.5 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium">{member.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {member.role}
                    {member.hourlyRate
                      ? ` · ${formatCurrency(member.hourlyRate, { currency })}/h`
                      : ''}
                  </p>
                </div>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${member.name} from the project`}
                    disabled={pending === member.id}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      setPending(member.id);
                      try {
                        const result = await runAction(() =>
                          removeProjectMemberAction(member.id),
                        );
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success(`${member.name} removed`);
                        router.refresh();
                      } finally {
                        setPending(null);
                      }
                    }}
                  >
                    <UserMinus />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {adding ? (
          <form
            className="grid gap-3 border-t border-border pt-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending('new');
              try {
                const result = await runAction(() =>
                  addProjectMemberAction({
                    projectId,
                    employeeId,
                    role,
                    hourlyRate: rate === '' ? null : Number(rate),
                  }),
                );
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success('Added to the project');
                setAdding(false);
                setEmployeeId('');
                setRate('');
                router.refresh();
              } finally {
                setPending(null);
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="member-person">Person</Label>
              <Select value={employeeId || undefined} onValueChange={setEmployeeId}>
                <SelectTrigger id="member-person" size="sm">
                  <SelectValue placeholder="Choose someone" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="member-role">Role on this project</Label>
              <Input
                id="member-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="h-8 text-[13px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="member-rate">Hourly rate</Label>
              <Input
                id="member-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="Optional"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className="h-8 text-[13px] tabular"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={pending === 'new'} disabled={!employeeId}>
                Add
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

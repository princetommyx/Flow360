'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MODULE_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  permissionKey,
  type PermissionAction,
  type PermissionModule,
} from '@/lib/permissions';
import { cn } from '@/lib/utils';

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
};

/**
 * The grid of everything a role may do.
 *
 * Granting anything at all implies being able to see it, so ticking create,
 * edit, delete or export ticks view too. Unticking view therefore clears the
 * whole row: a permission to edit something you cannot open is not a state the
 * rest of the app can act on.
 */
export function PermissionMatrix({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const granted = React.useMemo(() => new Set(value), [value]);

  function apply(next: Set<string>) {
    onChange(Array.from(next).sort());
  }

  function toggle(moduleName: PermissionModule, action: PermissionAction, on: boolean) {
    const next = new Set(granted);
    const key = permissionKey(moduleName, action);

    if (on) {
      next.add(key);
      next.add(permissionKey(moduleName, 'view'));
    } else if (action === 'view') {
      for (const each of PERMISSION_ACTIONS) next.delete(permissionKey(moduleName, each));
    } else {
      next.delete(key);
    }

    apply(next);
  }

  function toggleModule(moduleName: PermissionModule, on: boolean) {
    const next = new Set(granted);
    for (const action of PERMISSION_ACTIONS) {
      const key = permissionKey(moduleName, action);
      if (on) next.add(key);
      else next.delete(key);
    }
    apply(next);
  }

  function setEverything(on: boolean) {
    if (!on) return apply(new Set());
    const next = new Set<string>();
    for (const moduleName of PERMISSION_MODULES) {
      for (const action of PERMISSION_ACTIONS) next.add(permissionKey(moduleName, action));
    }
    apply(next);
  }

  const total = PERMISSION_MODULES.length * PERMISSION_ACTIONS.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted-foreground">
          <span className="tabular font-medium text-foreground">{granted.size}</span> of{' '}
          <span className="tabular">{total}</span> permissions granted
        </p>
        {disabled ? null : (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEverything(true)}>
              Grant everything
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEverything(false)}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[34rem] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              <th className="px-4 py-2.5 text-left font-medium">Module</th>
              {PERMISSION_ACTIONS.map((action) => (
                <th key={action} className="px-3 py-2.5 text-center font-medium">
                  {ACTION_LABELS[action]}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-medium">All</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((moduleName) => {
              const checkedCount = PERMISSION_ACTIONS.filter((action) =>
                granted.has(permissionKey(moduleName, action)),
              ).length;

              return (
                <tr
                  key={moduleName}
                  className={cn(
                    'border-b border-border last:border-0',
                    checkedCount === 0 && 'text-muted-foreground',
                  )}
                >
                  <td className="px-4 py-2 font-medium">{MODULE_LABELS[moduleName]}</td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const key = permissionKey(moduleName, action);
                    return (
                      <td key={action} className="px-3 py-2 text-center">
                        <Checkbox
                          checked={granted.has(key)}
                          disabled={disabled}
                          aria-label={`${ACTION_LABELS[action]} ${MODULE_LABELS[moduleName]}`}
                          onCheckedChange={(next) => toggle(moduleName, action, next === true)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    <Checkbox
                      checked={checkedCount === PERMISSION_ACTIONS.length}
                      disabled={disabled}
                      aria-label={`Everything in ${MODULE_LABELS[moduleName]}`}
                      onCheckedChange={(next) => toggleModule(moduleName, next === true)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

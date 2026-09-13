'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  /** Renders a divider above this item. */
  separatorBefore?: boolean;
  disabled?: boolean;
};

/** The `⋯` menu used at the end of every table row. */
export function RowActions({
  actions,
  label = 'Row actions',
}: {
  actions: RowAction[];
  label?: string;
}) {
  const visible = actions.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-muted-foreground data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {visible.map((action, index) => {
          const Icon = action.icon;
          const item = (
            <DropdownMenuItem
              key={action.label}
              variant={action.destructive ? 'destructive' : 'default'}
              disabled={action.disabled}
              onSelect={
                action.onSelect
                  ? (event) => {
                      event.preventDefault();
                      action.onSelect?.();
                    }
                  : undefined
              }
              asChild={Boolean(action.href)}
            >
              {action.href ? (
                <Link href={action.href}>
                  {Icon ? <Icon aria-hidden /> : null}
                  {action.label}
                </Link>
              ) : (
                <>
                  {Icon ? <Icon aria-hidden /> : null}
                  {action.label}
                </>
              )}
            </DropdownMenuItem>
          );

          return action.separatorBefore && index > 0 ? (
            <React.Fragment key={action.label}>
              <DropdownMenuSeparator />
              {item}
            </React.Fragment>
          ) : (
            item
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

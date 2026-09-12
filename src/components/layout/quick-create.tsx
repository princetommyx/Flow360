'use client';

import Link from 'next/link';
import {
  FileText,
  Package,
  Plus,
  ReceiptText,
  TrendingDown,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PermissionKey } from '@/lib/permissions';

const ACTIONS: Array<{
  label: string;
  href: string;
  icon: typeof FileText;
  permission: PermissionKey;
}> = [
  { label: 'Invoice', href: '/invoices/new', icon: FileText, permission: 'invoices.create' },
  { label: 'Quotation', href: '/quotations/new', icon: ReceiptText, permission: 'quotations.create' },
  { label: 'Customer', href: '/customers/new', icon: UserPlus, permission: 'customers.create' },
  { label: 'Product', href: '/products/new', icon: Package, permission: 'products.create' },
  { label: 'Expense', href: '/expenses/new', icon: TrendingDown, permission: 'expenses.create' },
];

/** Header shortcut to the create forms the member is allowed to use. */
export function QuickCreate({ permissions }: { permissions: string[] }) {
  const allowed = ACTIONS.filter(
    (action) => permissions.includes('*') || permissions.includes(action.permission),
  );

  if (allowed.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allowed.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={action.href} asChild>
              <Link href={action.href}>
                <Icon aria-hidden />
                {action.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

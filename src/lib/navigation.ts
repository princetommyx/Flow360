import type { IconName } from '@/components/shared/icon';
import { importPermissionKeys } from '@/lib/import/datasets';
import type { PermissionKey } from '@/lib/permissions';

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  /**
   * The item is hidden unless the member holds this permission. An array means
   * any one of them is enough, for a page that serves more than one module.
   */
  permission?: PermissionKey | PermissionKey[];
  /** Extra keywords surfaced by the command palette. */
  keywords?: string[];
  /**
   * A capability the deployment has to have, beyond anything the member holds.
   * The assistant is off unless an API key is configured, and a link to a page
   * that can only say "not switched on" is exactly the dead control this
   * product does not ship.
   */
  requires?: 'assistant';
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'dashboard',
        permission: 'dashboard.view',
        keywords: ['home', 'overview', 'metrics'],
      },
      {
        label: 'Assistant',
        href: '/assistant',
        icon: 'assistant',
        requires: 'assistant',
        keywords: ['ask', 'chat', 'ai', 'draft an invoice', 'help'],
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        label: 'Invoices',
        href: '/invoices',
        icon: 'invoice',
        permission: 'invoices.view',
        keywords: ['bill customer', 'receivables'],
      },
      {
        label: 'Quotations',
        href: '/quotations',
        icon: 'quotation',
        permission: 'quotations.view',
        keywords: ['estimate', 'proposal', 'quote'],
      },
      {
        label: 'Customers',
        href: '/customers',
        icon: 'customers',
        permission: 'customers.view',
        keywords: ['clients', 'crm', 'accounts'],
      },
      {
        label: 'Payments',
        href: '/payments',
        icon: 'payments',
        permission: 'payments.view',
        keywords: ['receipts', 'collections'],
      },
    ],
  },
  {
    label: 'Purchases',
    items: [
      {
        label: 'Purchase orders',
        href: '/purchase-orders',
        icon: 'purchaseOrder',
        permission: 'purchases.view',
        keywords: ['po', 'procurement'],
      },
      {
        label: 'Suppliers',
        href: '/suppliers',
        icon: 'suppliers',
        permission: 'suppliers.view',
        keywords: ['vendors'],
      },
      {
        label: 'Bills',
        href: '/bills',
        icon: 'bills',
        permission: 'bills.view',
        keywords: ['payables', 'supplier invoice'],
      },
    ],
  },
  {
    label: 'Products',
    items: [
      {
        label: 'Products',
        href: '/products',
        icon: 'products',
        permission: 'products.view',
        keywords: ['items', 'services', 'catalogue'],
      },
      {
        label: 'Categories',
        href: '/categories',
        icon: 'categories',
        permission: 'products.view',
      },
      {
        label: 'Inventory',
        href: '/inventory',
        icon: 'inventory',
        permission: 'inventory.view',
        keywords: ['stock', 'warehouse'],
      },
      {
        label: 'Stock adjustments',
        href: '/stock-adjustments',
        icon: 'stockAdjustment',
        permission: 'inventory.view',
        keywords: ['stock in', 'stock out', 'count'],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Expenses',
        href: '/expenses',
        icon: 'expenses',
        permission: 'expenses.view',
        keywords: ['spend', 'costs'],
      },
      {
        label: 'Income',
        href: '/income',
        icon: 'income',
        permission: 'transactions.view',
        keywords: ['revenue', 'earnings'],
      },
      {
        label: 'Accounts',
        href: '/accounts',
        icon: 'accounts',
        permission: 'accounts.view',
        keywords: ['bank', 'cash', 'balances'],
      },
      {
        label: 'Transactions',
        href: '/transactions',
        icon: 'transactions',
        permission: 'transactions.view',
        keywords: ['ledger', 'movements'],
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'Employees',
        href: '/employees',
        icon: 'employees',
        permission: 'employees.view',
        keywords: ['staff', 'team', 'hr'],
      },
      {
        label: 'Payroll',
        href: '/payroll',
        icon: 'payroll',
        permission: 'payroll.view',
        keywords: ['salary', 'wages', 'payslip'],
      },
      {
        label: 'Attendance',
        href: '/attendance',
        icon: 'attendance',
        permission: 'attendance.view',
        keywords: ['clock in', 'timekeeping'],
      },
    ],
  },
  {
    label: 'Projects',
    items: [
      {
        label: 'Projects',
        href: '/projects',
        icon: 'projects',
        permission: 'projects.view',
        keywords: ['jobs', 'engagements'],
      },
      {
        label: 'Tasks',
        href: '/tasks',
        icon: 'tasks',
        permission: 'tasks.view',
        keywords: ['todo', 'work items'],
      },
      {
        label: 'Timesheets',
        href: '/timesheets',
        icon: 'timesheets',
        permission: 'timesheets.view',
        keywords: ['hours', 'time tracking'],
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      {
        label: 'Sales reports',
        href: '/reports/sales',
        icon: 'reportSales',
        permission: 'reports.view',
      },
      {
        label: 'Expense reports',
        href: '/reports/expenses',
        icon: 'reportExpenses',
        permission: 'reports.view',
      },
      {
        label: 'Inventory reports',
        href: '/reports/inventory',
        icon: 'reportInventory',
        permission: 'reports.view',
      },
      {
        label: 'Profit and loss',
        href: '/reports/financial',
        icon: 'reportFinancial',
        permission: 'reports.view',
        keywords: ['profit and loss', 'p&l'],
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        label: 'Company',
        href: '/settings/company',
        icon: 'company',
        permission: 'settings.view',
        keywords: ['organisation', 'branches', 'branding'],
      },
      {
        label: 'Users',
        href: '/settings/users',
        icon: 'customers',
        permission: 'users.view',
        keywords: ['team members', 'invite'],
      },
      {
        label: 'Roles and permissions',
        href: '/settings/roles',
        icon: 'roles',
        permission: 'users.view',
        keywords: ['access control', 'rbac'],
      },
      {
        label: 'Invoicing',
        href: '/settings/invoicing',
        icon: 'invoiceSettings',
        permission: 'settings.view',
        keywords: ['numbering', 'terms'],
      },
      {
        label: 'Tax',
        href: '/settings/tax',
        icon: 'tax',
        permission: 'settings.view',
        keywords: ['vat', 'gst', 'rates'],
      },
      {
        label: 'Notifications',
        href: '/settings/notifications',
        icon: 'bell',
        permission: 'settings.view',
      },
      {
        label: 'Import data',
        href: '/settings/import',
        icon: 'import',
        // Loading a file of customers is adding customers, so whoever may do
        // the one may do the other. It is not an owner-only setting.
        permission: importPermissionKeys(),
        keywords: ['migrate', 'migration', 'erpnext', 'csv', 'upload', 'transfer'],
      },
      {
        label: 'Plan & billing',
        href: '/settings/billing',
        icon: 'card',
        permission: 'settings.view',
        keywords: ['subscription', 'trial', 'plan', 'upgrade'],
      },
    ],
  },
];

/** Extra destinations that belong in search but not in the sidebar. */
export const EXTRA_SEARCH_TARGETS: NavItem[] = [
  { label: 'My profile', href: '/settings/profile', icon: 'settings' },
  { label: 'Notification inbox', href: '/notifications', icon: 'bell' },
  { label: 'Payments received', href: '/payments', icon: 'payments' },
  { label: 'Business health', href: '/dashboard', icon: 'gauge' },
];

export function filterNavByPermissions(
  groups: NavGroup[],
  can: (permission?: PermissionKey | PermissionKey[]) => boolean,
  has: (capability?: NavItem['requires']) => boolean = () => true,
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.permission) && has(item.requires)),
    }))
    .filter((group) => group.items.length > 0);
}

/** Longest-prefix match so `/invoices/abc` highlights `Invoices`. */
export function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

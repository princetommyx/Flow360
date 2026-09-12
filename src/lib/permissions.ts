/**
 * Role-based access control.
 *
 * A permission key is `<module>.<action>`, e.g. `invoices.create`. Role
 * templates below are seeded into every new organization; owners and admins
 * are additionally granted the wildcard `*` which short-circuits every check.
 */

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_MODULES = [
  'dashboard',
  'invoices',
  'quotations',
  'customers',
  'payments',
  'purchases',
  'suppliers',
  'bills',
  'products',
  'inventory',
  'expenses',
  'accounts',
  'transactions',
  'employees',
  'payroll',
  'attendance',
  'projects',
  'tasks',
  'timesheets',
  'reports',
  'settings',
  'users',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type PermissionKey = `${PermissionModule}.${PermissionAction}`;

export const WILDCARD = '*';

export function permissionKey(
  module: PermissionModule,
  action: PermissionAction,
): PermissionKey {
  return `${module}.${action}`;
}

/** Every key in the system — used to seed the Permission catalogue. */
export function allPermissionKeys(): PermissionKey[] {
  return PERMISSION_MODULES.flatMap((module) =>
    PERMISSION_ACTIONS.map((action) => permissionKey(module, action)),
  );
}

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  quotations: 'Quotations',
  customers: 'Customers',
  payments: 'Payments',
  purchases: 'Purchase orders',
  suppliers: 'Suppliers',
  bills: 'Bills',
  products: 'Products',
  inventory: 'Inventory',
  expenses: 'Expenses',
  accounts: 'Accounts',
  transactions: 'Transactions',
  employees: 'Employees',
  payroll: 'Payroll',
  attendance: 'Attendance',
  projects: 'Projects',
  tasks: 'Tasks',
  timesheets: 'Timesheets',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users & roles',
};

export const ROLE_KEYS = [
  'owner',
  'admin',
  'manager',
  'accountant',
  'sales',
  'employee',
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

type RoleTemplate = {
  key: RoleKey;
  name: string;
  description: string;
  /** `'*'` grants everything; otherwise an explicit list of permission keys. */
  permissions: PermissionKey[] | typeof WILDCARD;
};

const full = (...modules: PermissionModule[]): PermissionKey[] =>
  modules.flatMap((module) =>
    PERMISSION_ACTIONS.map((action) => permissionKey(module, action)),
  );

const readOnly = (...modules: PermissionModule[]): PermissionKey[] =>
  modules.map((module) => permissionKey(module, 'view'));

const readExport = (...modules: PermissionModule[]): PermissionKey[] =>
  modules.flatMap((module) => [
    permissionKey(module, 'view'),
    permissionKey(module, 'export'),
  ]);

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    key: 'owner',
    name: 'Owner',
    description: 'Unrestricted access, including billing and organization deletion.',
    permissions: WILDCARD,
  },
  {
    key: 'admin',
    name: 'Administrator',
    description: 'Full access to every module and to user management.',
    permissions: WILDCARD,
  },
  {
    key: 'manager',
    name: 'Manager',
    description:
      'Runs day-to-day operations across sales, purchasing, inventory and projects.',
    permissions: [
      ...full(
        'invoices',
        'quotations',
        'customers',
        'payments',
        'purchases',
        'suppliers',
        'bills',
        'products',
        'inventory',
        'projects',
        'tasks',
        'timesheets',
      ),
      ...readExport('dashboard', 'reports', 'expenses', 'employees', 'accounts'),
      ...readOnly('transactions', 'attendance'),
    ],
  },
  {
    key: 'accountant',
    name: 'Accountant',
    description: 'Owns finance: expenses, payments, accounts, payroll and reporting.',
    permissions: [
      ...full('expenses', 'payments', 'accounts', 'transactions', 'bills', 'payroll'),
      ...readExport('dashboard', 'reports', 'invoices', 'quotations', 'customers', 'suppliers', 'employees'),
      ...readOnly('products', 'inventory', 'purchases', 'projects'),
    ],
  },
  {
    key: 'sales',
    name: 'Sales',
    description: 'Works the pipeline: customers, quotations, invoices and payments.',
    permissions: [
      ...full('customers', 'quotations', 'invoices'),
      permissionKey('payments', 'view'),
      permissionKey('payments', 'create'),
      ...readExport('dashboard', 'reports'),
      ...readOnly('products', 'inventory', 'projects', 'tasks'),
    ],
  },
  {
    key: 'employee',
    name: 'Employee',
    description: 'Self-service access to assigned projects, tasks and timesheets.',
    permissions: [
      ...readOnly('dashboard', 'projects', 'customers', 'products'),
      ...full('tasks', 'timesheets'),
      permissionKey('attendance', 'view'),
    ],
  },
];

export function templateFor(key: RoleKey) {
  return ROLE_TEMPLATES.find((role) => role.key === key) ?? ROLE_TEMPLATES[5];
}

/** Resolve a role template into a concrete permission list. */
export function resolveTemplatePermissions(key: RoleKey): PermissionKey[] {
  const template = templateFor(key);
  return template.permissions === WILDCARD
    ? allPermissionKeys()
    : Array.from(new Set(template.permissions));
}

/** The check used by every guard in the app. */
export function hasPermission(
  granted: readonly string[],
  required: PermissionKey | PermissionKey[],
): boolean {
  if (granted.includes(WILDCARD)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.every((key) => granted.includes(key));
}

export function hasAnyPermission(
  granted: readonly string[],
  required: readonly PermissionKey[],
): boolean {
  if (granted.includes(WILDCARD)) return true;
  return required.some((key) => granted.includes(key));
}

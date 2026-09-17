import {
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardList,
  Coins,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  HandCoins,
  Import,
  LayoutDashboard,
  ListChecks,
  Package,
  PaintRoller,
  PackageSearch,
  Percent,
  PieChart,
  Receipt,
  ReceiptText,
  Scale,
  Sparkles,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Timer,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Icon registry.
 *
 * Navigation is defined as plain serialisable data so it can be filtered on
 * the server and handed to client components; icons are referenced by name and
 * resolved here, on the client side of the boundary.
 */
export const ICONS = {
  dashboard: LayoutDashboard,
  invoice: FileText,
  quotation: ReceiptText,
  customers: Users,
  payments: HandCoins,
  purchaseOrder: ShoppingCart,
  suppliers: Truck,
  bills: Receipt,
  products: Package,
  categories: Tags,
  inventory: Warehouse,
  stockAdjustment: PackageSearch,
  expenses: TrendingDown,
  income: TrendingUp,
  accounts: Wallet,
  transactions: Coins,
  employees: UserCog,
  payroll: Banknote,
  attendance: CalendarCheck,
  projects: FolderKanban,
  tasks: ListChecks,
  timesheets: Timer,
  reportSales: BarChart3,
  reportExpenses: PieChart,
  reportInventory: Boxes,
  reportFinancial: Scale,
  company: Building2,
  roles: ShieldCheck,
  invoiceSettings: ClipboardList,
  invoiceDesign: PaintRoller,
  tax: Percent,
  bell: Bell,
  settings: Settings2,
  card: CreditCard,
  gauge: Gauge,
  assistant: Sparkles,
  import: Import,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Component = ICONS[name];
  return <Component className={cn('size-4', className)} aria-hidden />;
}

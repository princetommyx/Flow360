import type { badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;

export type StatusMeta = { label: string; variant: BadgeVariant };

/**
 * One place that maps every persisted status enum to its label and colour,
 * so an invoice looks the same in a table, a detail page and a PDF.
 */
const STATUS_MAP: Record<string, StatusMeta> = {
  // Invoices
  DRAFT: { label: 'Draft', variant: 'neutral' },
  SENT: { label: 'Sent', variant: 'info' },
  VIEWED: { label: 'Viewed', variant: 'info' },
  PARTIALLY_PAID: { label: 'Partially paid', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },

  // Quotations
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'warning' },
  CONVERTED: { label: 'Converted', variant: 'brand' },

  // Purchase orders
  CONFIRMED: { label: 'Confirmed', variant: 'info' },
  PARTIALLY_RECEIVED: { label: 'Partially received', variant: 'warning' },
  RECEIVED: { label: 'Received', variant: 'success' },
  BILLED: { label: 'Billed', variant: 'brand' },
  AWAITING_PAYMENT: { label: 'Awaiting payment', variant: 'warning' },

  // Parties & products
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'neutral' },
  BLOCKED: { label: 'Blocked', variant: 'destructive' },

  // Expenses
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REIMBURSED: { label: 'Reimbursed', variant: 'brand' },

  // People
  ON_LEAVE: { label: 'On leave', variant: 'warning' },
  PROBATION: { label: 'Probation', variant: 'info' },
  TERMINATED: { label: 'Terminated', variant: 'neutral' },
  PRESENT: { label: 'Present', variant: 'success' },
  ABSENT: { label: 'Absent', variant: 'destructive' },
  LATE: { label: 'Late', variant: 'warning' },
  HALF_DAY: { label: 'Half day', variant: 'info' },
  LEAVE: { label: 'Leave', variant: 'neutral' },
  HOLIDAY: { label: 'Holiday', variant: 'neutral' },

  // Projects & tasks
  PLANNING: { label: 'Planning', variant: 'neutral' },
  ON_HOLD: { label: 'On hold', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  TODO: { label: 'To do', variant: 'neutral' },
  IN_PROGRESS: { label: 'In progress', variant: 'info' },
  IN_REVIEW: { label: 'In review', variant: 'brand' },
  DONE: { label: 'Done', variant: 'success' },
  BLOCKED_TASK: { label: 'Blocked', variant: 'destructive' },

  // Priorities
  LOW: { label: 'Low', variant: 'neutral' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  URGENT: { label: 'Urgent', variant: 'destructive' },

  // Employment / payment types
  FULL_TIME: { label: 'Full time', variant: 'neutral' },
  PART_TIME: { label: 'Part time', variant: 'neutral' },
  CONTRACT: { label: 'Contract', variant: 'neutral' },
  INTERN: { label: 'Intern', variant: 'neutral' },
  CASH: { label: 'Cash', variant: 'neutral' },
  BANK_TRANSFER: { label: 'Bank transfer', variant: 'neutral' },
  CARD: { label: 'Card', variant: 'neutral' },
  CHECK: { label: 'Check', variant: 'neutral' },
  MOBILE_MONEY: { label: 'Mobile money', variant: 'neutral' },
  ONLINE: { label: 'Online', variant: 'neutral' },
  OTHER: { label: 'Other', variant: 'neutral' },

  // Membership
  INVITED: { label: 'Invited', variant: 'warning' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
};

export function statusMeta(value: string | null | undefined): StatusMeta {
  if (!value) return { label: '—', variant: 'neutral' };
  return (
    STATUS_MAP[value] ?? {
      label: value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^./, (c) => c.toUpperCase()),
      variant: 'neutral',
    }
  );
}

/** Turns an enum object into `{ value, label }` pairs for filters and selects. */
export function statusOptions<T extends Record<string, string>>(enumObject: T) {
  return Object.values(enumObject).map((value) => ({
    value,
    label: statusMeta(value).label,
  }));
}

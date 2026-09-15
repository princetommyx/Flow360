import { z } from 'zod';

/**
 * Projects, the work on them, and the hours booked against them.
 */

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;

export const projectSchema = z
  .object({
    name: z.string().trim().min(2, 'Give the project a name').max(120),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'Give it a short code')
      .max(20)
      .regex(/^[A-Z0-9-]+$/, 'Letters, numbers and dashes only'),
    customerId: z.string().nullable().optional(),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    status: z.enum(PROJECT_STATUSES, { message: 'Choose a status' }),
    startDate: z.string().min(1, 'Choose a start date'),
    endDate: z.string().optional().or(z.literal('')),
    budget: z
      .number({ message: 'Enter a budget' })
      .min(0, 'Cannot be negative')
      .max(999_999_999),
    progress: z
      .number({ message: 'Enter the progress' })
      .int('Whole percentages only')
      .min(0, 'Cannot be negative')
      .max(100, 'A project cannot be more than finished'),
  })
  .refine(
    (data) => !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    { message: 'The end date cannot be before the start date', path: ['endDate'] },
  );

export type ProjectInput = z.infer<typeof projectSchema>;

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Say what needs doing').max(200),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.enum(TASK_STATUSES, { message: 'Choose a status' }),
  priority: z.enum(TASK_PRIORITIES, { message: 'Choose a priority' }),
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z
    .number({ message: 'Enter the hours' })
    .min(0, 'Cannot be negative')
    .max(9999)
    .nullable()
    .optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;

/**
 * An entry on a timesheet.
 *
 * The rate is optional: hours on an internal project are worth recording even
 * when nobody is billed for them, and forcing a number there would invite a
 * made-up one.
 */
export const timesheetSchema = z.object({
  projectId: z.string().min(1, 'Choose a project'),
  taskId: z.string().nullable().optional(),
  employeeId: z.string().nullable().optional(),
  date: z.string().min(1, 'Choose a date'),
  hours: z
    .number({ message: 'Enter the hours' })
    .gt(0, 'Enter more than zero hours')
    .max(24, 'A day has 24 hours'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  billable: z.boolean(),
  hourlyRate: z
    .number({ message: 'Enter a rate' })
    .min(0, 'Cannot be negative')
    .max(99_999)
    .nullable()
    .optional(),
});

export type TimesheetInput = z.infer<typeof timesheetSchema>;

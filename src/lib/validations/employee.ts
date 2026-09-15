import { z } from 'zod';

/**
 * People records.
 *
 * `employeeNumber` is left out: it is minted per organization the same way a
 * document number is, so two people added at once cannot collide on it.
 */

export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;
export const EMPLOYMENT_STATUSES = [
  'ACTIVE',
  'PROBATION',
  'ON_LEAVE',
  'TERMINATED',
] as const;

export const employeeSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter a first name').max(80),
    lastName: z.string().trim().min(1, 'Enter a last name').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    department: z.string().trim().max(80).optional().or(z.literal('')),
    position: z.string().trim().max(80).optional().or(z.literal('')),
    employmentType: z.enum(EMPLOYMENT_TYPES, { message: 'Choose an employment type' }),
    status: z.enum(EMPLOYMENT_STATUSES, { message: 'Choose a status' }),
    hiredAt: z.string().min(1, 'Choose a start date'),
    terminatedAt: z.string().optional().or(z.literal('')),
    baseSalary: z
      .number({ message: 'Enter a salary' })
      .min(0, 'Cannot be negative')
      .max(99_999_999),
    addressLine1: z.string().trim().max(160).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    country: z.string().trim().max(80).optional().or(z.literal('')),
    bankAccount: z.string().trim().max(60).optional().or(z.literal('')),
    taxNumber: z.string().trim().max(60).optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine(
    (data) => !data.terminatedAt || new Date(data.terminatedAt) >= new Date(data.hiredAt),
    {
      message: 'The leaving date cannot be before the start date',
      path: ['terminatedAt'],
    },
  )
  .refine((data) => data.status !== 'TERMINATED' || Boolean(data.terminatedAt), {
    message: 'Give the date they left',
    path: ['terminatedAt'],
  });

export type EmployeeInput = z.infer<typeof employeeSchema>;

/**
 * One payslip.
 *
 * Every figure is entered gross and positive; the net is derived from them by
 * `calculatePayslip` rather than typed, so the payslip cannot disagree with
 * its own arithmetic.
 */
export const payrollSchema = z
  .object({
    employeeId: z.string().min(1, 'Choose an employee'),
    periodStart: z.string().min(1, 'Choose the start of the period'),
    periodEnd: z.string().min(1, 'Choose the end of the period'),
    baseSalary: z
      .number({ message: 'Enter the base pay' })
      .min(0, 'Cannot be negative')
      .max(99_999_999),
    allowances: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative').max(99_999_999),
    overtime: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative').max(99_999_999),
    bonus: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative').max(99_999_999),
    taxDeduction: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative').max(99_999_999),
    otherDeduction: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative').max(99_999_999),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .refine((data) => new Date(data.periodEnd) >= new Date(data.periodStart), {
    message: 'The period cannot end before it starts',
    path: ['periodEnd'],
  })
  .refine(
    (data) =>
      data.taxDeduction + data.otherDeduction <=
      data.baseSalary + data.allowances + data.overtime + data.bonus,
    {
      message: 'Deductions cannot come to more than the gross pay',
      path: ['taxDeduction'],
    },
  );

export type PayrollInput = z.infer<typeof payrollSchema>;

export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'LATE',
  'HALF_DAY',
  'ABSENT',
  'LEAVE',
  'HOLIDAY',
] as const;

/**
 * A day's attendance for one person.
 *
 * Hours are derived from the times when both are given, so the two cannot
 * drift apart; a day recorded without times can still carry hours typed by
 * hand, which is how a paper timesheet arrives.
 */
export const attendanceSchema = z
  .object({
    employeeId: z.string().min(1, 'Choose an employee'),
    date: z.string().min(1, 'Choose a date'),
    status: z.enum(ATTENDANCE_STATUSES, { message: 'Choose a status' }),
    checkIn: z.string().optional().or(z.literal('')),
    checkOut: z.string().optional().or(z.literal('')),
    hoursWorked: z
      .number({ message: 'Enter the hours' })
      .min(0, 'Cannot be negative')
      .max(24, 'A day has 24 hours'),
    notes: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine((data) => !data.checkIn || !data.checkOut || data.checkOut > data.checkIn, {
    message: 'The finish time must be after the start time',
    path: ['checkOut'],
  });

export type AttendanceInput = z.infer<typeof attendanceSchema>;

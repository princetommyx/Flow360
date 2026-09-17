/**
 * What each tool is called in front of a person.
 *
 * Here rather than beside the tools because both sides need it: the server
 * names the step as it runs it, and the browser names it again in the trace
 * above a finished reply. The tools themselves live behind `server-only`, and
 * a client component reaching for one of them would drag the whole model
 * client into the browser bundle.
 */
export const TOOL_LABELS: Record<string, string> = {
  business_summary: 'Looking at the figures',
  search_customers: 'Looking up customers',
  search_products: 'Looking up products',
  list_invoices: 'Reading the invoices',
  get_invoice: 'Opening the invoice',
  search_employees: 'Looking up staff',
  list_attendance: 'Reading attendance',
  list_payroll: 'Reading payroll',
  draft_invoice: 'Drafting the invoice',
  draft_quotation: 'Drafting the quotation',
  draft_customer: 'Drafting the customer',
  draft_payment: 'Drafting the payment',
  draft_attendance: 'Drafting the attendance day',
  draft_employee: 'Drafting the staff record',
  draft_payslip: 'Drafting the payslip',
};

export function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name.replace(/_/g, ' ');
}

# Invoice designs

Six ways the same invoice can look on paper. **Settings → Invoice design.**

## The rule that makes it safe

A design chooses nothing. It receives a finished document — the stored
subtotal, discount, tax, total and balance — and lays it out. It cannot reach
past that to recompute anything, because the shape it is handed
(`InvoiceDocument`, in `src/lib/invoice-document.ts`) contains numbers, not
line items to be re-totalled.

So switching design can change what an invoice looks like and never what it
says. That is also why gating designs on the plan is fair rather than mean: a
workspace that drops to Starter loses a look, not a figure.

The one thing no design is allowed to decide for itself is which total rows
apply — `totalRows()` in `parts.tsx` does that once for all six, so none of them
can quietly drop the shipping line or show "Paid to date" against nothing.

## What you get

| Design | Comes with | What it is |
| --- | --- | --- |
| Classic | Starter | Ruled sections, a status pill, a plain totals block. The default. |
| Compact | Starter | Smaller type, tighter rows, four columns. For long invoices. |
| Modern | Business | A coloured band across the top with the amount due beside it. |
| Elegant | Business | Serif headings, hairline rules, a lot of white. |
| Bold | Business | The amount due set large at the top, over a dark totals panel. |
| Letterhead | Enterprise | Leaves the top 45mm clear for pre-printed paper. |

Starter gets two, Business five, Enterprise all six. The pricing page counts
them from the registry rather than quoting a number somebody typed, so adding a
design updates the plan copy on its own.

**A trial counts as Business.** `entitledPlan()` is what every gate asks, and it
answers "business" while the trial runs. Somebody evaluating the product sees
five designs, not two.

## Previewing

Each tile on the settings page is the real component rendering a made-up
invoice at a third of A4 — not a screenshot, so a design cannot be advertised
looking like something it does not print as.

The invoice is invented; the business on it is not. Your own name, address, tax
ID, tax label, payment instructions and footer are on every preview, because
the question being asked is how *your* invoice looks.

**See it full size** opens `/invoice-designs/<id>`: the same sample at printing
size, through the same toolbar as a real invoice, so it can be sent to a printer
and held. Only designs your plan includes will render there.

## When a plan lapses

The choice stays on the settings row. The print route resolves it through
`resolveInvoiceTemplate()`, which falls back to Classic when the plan no longer
includes what was chosen — printing something rather than refusing, because the
argument about the plan belongs on the settings page and not between somebody
and their invoice. The settings page says so plainly where they chose it, and
the original choice comes back the moment the plan does.

## Adding one

1. A row in `INVOICE_TEMPLATES` (`src/lib/config/invoice-templates.ts`) with the
   plan it comes with.
2. A component in `src/components/invoice-templates/`, taking `{ doc }`.
3. A line in the `COMPONENTS` map in that folder's `index.tsx`.

No migration, no artwork, no change to the settings page, the print route or the
pricing page. The id is validated against the same list by the Zod schema, so a
design that exists is choosable and one that does not is refused.

Two things to respect: import nothing from the server — the designs render in
the browser for the previews — and take every figure from `doc`.

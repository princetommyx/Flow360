# Where the build has reached

A running record of what is finished, what is not, and the conventions any new
module has to follow. Written so the work can be picked up cold.

Last updated: 15 September 2026.

## State of the build

| Phase | Scope | State |
|---|---|---|
| 1 | Setup, design system, auth, schema, multi-tenancy, dashboard, navigation | Done |
| 2 | Customers, products, invoices, quotations, payments | Done |
| 3 | Inventory, suppliers, expenses, accounts, purchase orders, bills, transactions, income | Done |
| 4 | Employees, payroll, attendance, projects, tasks, timesheets | Done |
| 5 | Settings, reports, notifications | Settings done, reports and notifications **in progress** |
| 6 | Landing page, pricing, responsive polish, security review, performance | Mostly done alongside the rest |

### Still to build

Everything below currently renders `ModulePending`. That component is the
honest placeholder: a module either works or says plainly that it does not.

- `reports/sales`, `reports/expenses`, `reports/financial`, `reports/inventory`
- `notifications` — the centre reading the `Notification` model
- **Platform admin dashboard** — see its own section below

### Settings, finished

All six pages are built and exercised in a browser against real data.

- `settings/company` — details plus the currency switcher
- `settings/invoicing` — prefixes, padding, year, terms, notes, payment
  instructions, footer. The live preview is built with `formatDocumentNumber`
  from `lib/document-number.ts`, the same function the allocator uses, so the
  example shown before saving is the number that gets issued after.
- `settings/tax` — label, default rate, tax-inclusive pricing, and the
  `TaxRate` table. Marking one rate the default clears the others in the same
  transaction.
- `settings/profile` — your own name, phone, job title and password. Not behind
  `settings.edit`: everyone owns their own name. Changing the password checks
  the current one and burns any outstanding reset link.
- `settings/users` — invite, re-role, suspend, restore, remove. An address that
  already has an account joins immediately and keeps its password; a new
  address is `INVITED` until the emailed link sets one at `/accept-invite`.
  Owners and your own row are never editable from here.
- `settings/roles` — the full matrix over `Role` / `RolePermission`. Granting
  any action implies view; clearing view clears the row. The `owner` role is
  read only, so a workspace can always be recovered.

## Conventions a new module must follow

These are enforced by review, not by tooling, and every finished module already
obeys them. `docs/ARCHITECTURE.md` has the full rules; these are the ones that
bite.

**Shape of a module.** Five files, in this order:

1. `src/lib/validations/<thing>.ts` — Zod schemas, exported input types
2. `src/server/services/<things>.ts` — `'server-only'`, all reads, the `where`
   builder, the list function returning `{ rows, pageInfo, summary }`
3. `src/server/actions/<things>.ts` — `'use server'`, all writes
4. `src/app/(app)/<things>/page.tsx` — server component, `requirePermission`
5. `src/app/(app)/<things>/<things>-table.tsx` — client, wraps `DataTable`

Plus `new/`, `[id]/`, `[id]/edit/` and `export/route.ts` where the module needs
them.

**Tenancy.** Every query filters by `organizationId` from `requirePermission()`.
Never from user input. An id arriving in a form or query string is only honoured
after a lookup scoped to the tenant proves it belongs there.

**Authorisation.** The page calls `requirePermission('<module>.view')`; every
action calls `requirePermission('<module>.<action>')` before validating. Hiding
a button is not access control.

**Validation.** Actions `safeParse` and return `ActionResult`. Never throw at a
form.

**Money.** Only `calculateLine`, `calculateDocumentTotals` and
`calculatePayslip` from `lib/money.ts`. Never recompute inline. Expenses are
stored **negative** in `transactions.amount`, signed relative to the account the
money left; income is positive.

**Currency.** Pass `{ currency }` from `context.organization.currency` to every
`formatCurrency` call. The global default is a fallback, not the workspace's
currency. Adwuma360's own subscription prices use `PLATFORM_CURRENCY` from
`lib/config/plans.ts` instead, because they are not the tenant's money.

**Derived figures are derived.** A payslip's net, a project's spend, an
invoice's balance and a purchase order's status are all recomputed from their
parts rather than stored independently. If a figure can disagree with its own
inputs, it eventually will.

**Client actions.** Call through `runAction()` from `lib/client-action.ts`, or
at least know that `UnhandledErrorToast` is the only thing standing between a
thrown action and a button that looks broken.

**Refusals.** `requirePermission()` throws `AuthorizationError`, which carries
`FORBIDDEN_DIGEST` from `lib/forbidden.ts`. The error boundary at
`app/(app)/error.tsx` recognises that digest and says the role does not cover
the page, rather than apologising for a crash. Do not give that class a
different digest, and do not swallow it in a page.

**Copy.** No em dashes in anything a reader sees. Two sentences, a colon, or a
parenthetical. Code comments keep theirs.

**Lists.** `components/data-table`, state in the URL via `lib/query.ts`,
sortable columns whitelisted through `orderByFor`.

## Things that are true and easy to get wrong

- **Editing stops where a record becomes someone else's.** A sent quotation, a
  confirmed purchase order, an approved bill or payslip: cancel and reissue
  rather than rewriting. Deleting stops once money or stock has moved.
- **Lateness is re-derived on read.** There is no scheduler on this deployment,
  so `refreshOverdueBills` and `refreshExpiredQuotations` run when the list is
  opened.
- **Employee numbers use the numeric maximum**, not the lexicographic one.
- **The invite dialog preselects no role.** The list is ordered most powerful
  first, and a dialog anyone can tap through must not hand out administrator.
- **An invitation is one use.** Accepting sets the password, confirms the
  address and activates every outstanding `INVITED` membership for that
  account, then retires all its invitation tokens.
- **The seed and `prisma/deploy/*.sql` must agree.** The SQL snapshot is edited
  in place rather than regenerated, because the setup workflow depends on its
  ids. After editing it, apply it to an empty database and run
  `prisma migrate deploy` to confirm it reports nothing pending.

## Deployment

- Vercel builds from `main`. Work happens on `claude/eager-dijkstra-u81b8k` and
  is merged to `main`, which is what deploys.
- **Migrations are a separate, manual step.** Vercel runs on the pooled Neon
  connection string and `prisma migrate deploy` needs the direct one, so the
  build cannot apply them. After any schema change: run the **Set up database**
  workflow from the Actions tab, on `main`, with *load demo data* unticked.
- Applied so far: `init`, `add_trial_and_subscription`, `verification_codes`,
  `requested_billing_period`, `ghana_defaults`.
- Six transactional emails live in `lib/email/templates.ts`: confirmation code,
  welcome, password reset, trial started, plan requested, workspace invitation.
  Preview them with `npm run email:preview`, no provider needed.
- Email goes through Resend over HTTPS. `EMAIL_TRANSPORT=resend` plus
  `RESEND_API_KEY`; without both, `mailIsDelivered()` is false and the product
  says so rather than pointing at an empty inbox.

## The platform admin dashboard

Not started. The agreed shape, so it is not rebuilt as the wrong thing:

A console for the **operator of Adwuma360**, not an admin area inside a
workspace. It shows every organization on the platform, their plan, trial and
subscription status, sign-ups over time, and the plan requests that currently
sit in `organizations.requestedPlan` where nobody can see them.

It needs a **platform-level role separate from tenant RBAC** — being an owner of
one workspace must not grant sight of another. Expect a new column or table for
that, a guard alongside `requireTenant`, and a route group outside `(app)` so
the tenant sidebar and the active-organization cookie play no part.

The hard rule: it must never leak one tenant's business data into another's. It
reports *about* organizations — counts, plans, dates — not *from inside* them.

## Known gaps, deliberately left

- **No trial-ending reminder.** The trial email says days remaining are on the
  billing page rather than promising a reminder nothing sends.
- **No "password changed" notice.** Conventional, and missing.
- **Ownership cannot be transferred.** The owner row is immovable from
  `settings/users`, which is safe but means a departing founder needs a hand at
  the database.
- **Payment provider is not wired up.** Plan requests are recorded and a person
  follows up; nothing charges anyone. The billing page says so.
- **`hero.jpg` carries a rawpixel watermark** and needs a licensed replacement
  before commercial use.
- **Company details in `lib/config/brand.ts` are placeholders** — registered
  name, address and tax number appear on invoices and should be replaced.

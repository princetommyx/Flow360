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
| 5 | Settings, reports, notifications | Done |
| 6 | Landing page, pricing, responsive polish, security review, performance | Mostly done alongside the rest |
| — | Operator console for Adwuma360 itself | Done |

### Still to build

Nothing from the six phases. Anything still rendering `ModulePending` is
unbuilt, and that component is the honest placeholder: a module either works or
says plainly that it does not.

### Reports and notifications, finished

- `reports/sales` — invoiced against collected, by customer, by item, by status
- `reports/expenses` — spend by category and by supplier, expenses beside bills
- `reports/financial` — the profit and loss statement, cash on hand, money in
  and out
- `reports/inventory` — holding at cost and at selling price, by category, what
  moved, what needs reordering
- `notifications` — the inbox over the `Notification` model: read and unread,
  filter by type, search, mark, unmark, remove, clear the read ones

All four reports read through `server/services/reports.ts`, share
`components/reports/report-nav.tsx` so the period survives moving between them,
and export one flat CSV each with a `Section` column rather than four files.

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
sortable columns whitelisted through `orderByFor`. A small ranked table inside
a card uses `components/reports/ranked-table.tsx` instead: it has no URL state,
no sorting and no pagination, which is the point.

**Reports.** Revenue is what was invoiced, never what was collected. Figures
are recomputed from the rows they describe. Nothing under `reports/` writes.

## Things that are true and easy to get wrong

- **Editing stops where a record becomes someone else's.** A sent quotation, a
  confirmed purchase order, an approved bill or payslip: cancel and reissue
  rather than rewriting. Deleting stops once money or stock has moved.
- **Lateness is re-derived on read.** There is no scheduler on this deployment,
  so `refreshOverdueBills` and `refreshExpiredQuotations` run when the list is
  opened.
- **Employee numbers use the numeric maximum**, not the lexicographic one.
- **Order by a tiebreaker whenever the sort key can tie.** Notifications raised
  in one batch share a timestamp to the millisecond, and the planner is then
  free to return them in any order: the same list comes back shuffled between
  two renders. `[{ createdAt: 'desc' }, { id: 'desc' }]`.
- **A grid track has a min-content floor.** A card holding a table with a
  `min-w-*` widens the track instead of letting the table scroll, so report
  grids carry `[&>*]:min-w-0`.
- **There are two ways into a workspace, and they differ.** Registering with
  an email address creates the account and the workspace in one transaction.
  Google creates only the account, so `requireTenant` sends anyone with no
  membership at all to `/onboarding` to name their business. Anyone who *had* a
  membership goes to `/no-workspace` instead, because they have lost something
  rather than never having had it.
- **Google sign-in needs its own callback.** There is no Auth.js adapter, so
  without `resolveGoogleUser` the JWT would carry Google's identifier, no
  membership would resolve, and the button would lead nowhere. Matching an
  existing account by email is allowed only when Google reports the address
  verified.
- **A signed-in visitor with no workspace has somewhere to go.** Every
  workspace suspended, or the last membership removed, used to redirect
  `/dashboard` to `/login`, which redirects a signed-in visitor back to
  `/dashboard`. `requireTenant` now sends them to `/no-workspace`.
- **Relative times need `TimeAgo`.** The clock moves between the server
  rendering and the browser hydrating, so `formatRelative` inside a client
  component is a hydration mismatch. Server components can call it directly.
- **CSV guards text, not numbers.** A leading `-` is quoted out of formula
  range only for strings; guarding a number would turn every negative in a
  financial export into text, and a column of text will not total.
- **The invite dialog preselects no role.** The list is ordered most powerful
  first, and a dialog anyone can tap through must not hand out administrator.
- **An invitation is one use.** Accepting sets the password, confirms the
  address and activates every outstanding `INVITED` membership for that
  account, then retires all its invitation tokens.
- **The seed and `prisma/deploy/*.sql` must agree**, and `npm run deploy:sql`
  is what keeps them in step. The seed's reset also has to delete anything
  pointing at `users` with a RESTRICT constraint before it deletes the users.

## Deployment

- Vercel builds from `main`. Work happens on `claude/eager-dijkstra-u81b8k` and
  is merged to `main`, which is what deploys.
- **Migrations are a separate, manual step.** Vercel runs on the pooled Neon
  connection string and `prisma migrate deploy` needs the direct one, so the
  build cannot apply them. After any schema change: run the **Set up database**
  workflow from the Actions tab, on `main`, with *load demo data* unticked.
- Applied so far: `init`, `add_trial_and_subscription`, `verification_codes`,
  `requested_billing_period`, `ghana_defaults`, `platform_admin`.
- **`prisma/deploy/*.sql` is generated**, by `npm run deploy:sql` against a
  scratch database. Run it after any migration or seed change, and prove it by
  restoring into an empty database (see `prisma/deploy/README.md`).
- Six transactional emails live in `lib/email/templates.ts`: confirmation code,
  welcome, password reset, trial started, plan requested, workspace invitation.
  Preview them with `npm run email:preview`, no provider needed.
- Email goes through Resend over HTTPS. `EMAIL_TRANSPORT=resend` plus
  `RESEND_API_KEY`; without both, `mailIsDelivered()` is false and the product
  says so rather than pointing at an empty inbox.

## The operator console

Built, at `/admin`, in the `(platform)` route group. It is the console for the
**operator of Adwuma360**, not an admin area inside a workspace.

**Getting in.** Two routes, both checked by `requirePlatformAdmin()` in
`server/platform.ts`:

1. `users.isPlatformAdmin`, set by the **Create platform operator** workflow
   (`scripts/create-operator.ts`) and by the console's own People page.
2. `PLATFORM_ADMIN_EMAILS`, exact addresses in the environment. It marks an
   account that already exists, so it is for letting your own customer account
   into the console, and for getting back in if the last flag is revoked by
   mistake. It creates nothing.
3. `PLATFORM_ADMIN_DOMAINS`, whole domains, so everyone at the company is staff
   without being added one at a time. **This one requires the address to be
   confirmed**, and the other two do not: it is a wildcard, and anyone can type
   an address into the registration form, so without that condition claiming
   `anything@adwuma360.online` would be enough to walk into the console.
   Subdomains do not count; each has to be named.

**A staff account belongs to no workspace.** `/register` creates a workspace,
which would leave an operator owning a company inside the list they are
policing, so the workflow writes the user row directly: no membership, no
organization, password from the `PLATFORM_ADMIN_PASSWORD` secret so it never
reaches a log. Signing in then lands on `/no-workspace`, which recognises staff
and offers the console instead of explaining a problem.

**It does not announce itself.** A signed-in visitor who is not an operator
gets the ordinary not-found page, byte for byte what a mistyped address gets.
Saying "this area is for staff" answers a question nobody is entitled to ask:
it confirms a console exists, that this is its address, and that the only thing
in the way is the right account. Do not reintroduce a friendlier refusal.

Neither grants anything inside a customer's workspace, and being an owner or an
administrator of a workspace grants nothing here. The guard shares no code with
`server/tenant`: no active-organization cookie, no membership, no permission
keys.

**What it does.** Overview (sign-ups, plans, trials, committed monthly value),
Workspaces (list and a detail page per company), Plan requests (the queue that
`organizations.requestedPlan` was previously invisible in), People (every
account across every workspace) and Activity.

**What it changes.** Set a plan, decline a request, extend a trial, suspend and
restore a workspace, grant and revoke operator access, disable and enable an
account. Every one writes a row to `platform_audit_logs`, which is append-only
and visible to no workspace. `ActivityLog` could not hold these: it is tenant
scoped by design and some of these actions belong to no tenant.

**The hard rule, kept.** It reports *about* organizations: names, plans, dates,
counts. The workspace detail page shows how many customers and invoices a
company holds and never what is in one. There is no route from the console into
a tenant's records.

**Suspension** takes away sign-in and touches no data, so restoring is one flag
and everything is where they left it.

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

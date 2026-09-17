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

## Search

Technical groundwork only. It makes the marketing pages eligible to rank; it
does not make them rank, which is content and links over months.

- `app/robots.ts` opens up **only** on `brand.domain`. Every other host,
  including `*.vercel.app` and every preview, returns `Disallow: /`, because two
  copies of the same copy on two hostnames splits a ranking between them.
  Changing the domain without changing `NEXT_PUBLIC_BRAND_DOMAIN` would take the
  site out of the index, so the two must move together.
- `app/sitemap.ts` lists the six public pages by hand. The router is almost
  entirely the signed-in product, and a sitemap full of pages that redirect to a
  login screen is worse than none.
- Every page under `(app)` and `(auth)` sends `noindex, nofollow`, with `/login`
  and `/register` setting it back because they are worth finding. `robots.txt`
  asks a crawler not to fetch; the meta tag tells one that fetched anyway not to
  index. They are different promises and a page that matters needs both.
- `components/marketing/structured-data.tsx` holds Organization,
  SoftwareApplication and FAQPage. The FAQ schema is fed from the same array the
  page renders, because marking up an answer a reader cannot see is against
  Google's guidelines and costs the enhanced result.
- `app/opengraph-image.tsx` draws the share card from the brand config. Its
  renderer refuses any element with more than one child and no explicit
  `display`, so text and expressions are composed into a string first.

## Payments

Paystack subscriptions, wired end to end. See [PAYMENTS.md](PAYMENTS.md) for the
setup, which is four Plans in the Paystack dashboard, five environment variables
and a webhook URL.

**The webhook is the authority**, not the page the customer comes back to. A
browser gets closed on the way back from a checkout, and a renewal twelve months
from now involves no browser at all. `/settings/billing/complete` verifies the
reference so it can tell the person what happened, and writes nothing.

**Two prices, one figure.** The price on the screen lives in
`lib/config/plans.ts`; Paystack holds its own copy on each Plan. Before anybody
reaches a checkout the server reads the live plan and refuses if the two
disagree, so a misconfiguration stops a sale rather than charging a number
nobody was shown. `PLATFORM_CURRENCY` is `GHS` and a plan in any other currency
is refused rather than converted.

**Every event is idempotent.** `billing_events.reference` is unique, so a
redelivery — Paystack retries — collides and is answered as a duplicate before
any handler runs. Only that collision counts as "seen before": every other
database failure answers 500 so the retry is a real retry. Anything
unrecognised is recorded and acknowledged, because a 4xx would have Paystack
resend an event we will never understand, forever.

**Nothing is a dead control.** A plan is purchasable only when a Paystack plan
code is configured for that plan and period; the server works that out and the
chooser renders "Subscribe" or falls back to the request route accordingly.
With no secret key at all the billing page behaves exactly as it did before
payments existed. Enterprise stays on the request route by design.

**Cancelling** stops the renewal and cuts nothing short: the period already paid
for is kept, which is Paystack's behaviour and the fair one. It is offered while
a renewal is failing too, so somebody past due can stop it rather than waiting
out the retries.

**A subscription ends the trial.** `trialState` returns "none" for any workspace
that has been through one, so the sidebar countdown and the banner stop
counting down a trial at somebody whose card was just declined.

**The operator console** shows the ledger per workspace — every event as it
arrived, failures included — plus the subscription state and Paystack customer
code. Setting a plan from the console charges nobody and does not touch a
Paystack subscription.

## Migrating in

A business already running on something else — ERPNext, in the case this was
built for — can load what it has. **Settings → Import data**, and
[MIGRATING.md](MIGRATING.md) for the whole of it.

**The importer knows their column headings.** Every field carries the names
other systems give it, matched on a normalised form, so `Customer Name`,
`customer_name` and `customername` are one entry and an ERPNext export maps
itself. ERPNext's child-table headings (`Rate (Items)`) are recognised too,
which is what makes an invoice with three lines arrive as one invoice with
three lines rather than three invoices, two of them nameless.

**Nothing is written until it has been shown.** The file is read, every row is
judged, and the plan — the mapping, the first rows as they will land, the rows
that will not go in — is on screen before the button that writes appears.
Changing a column re-reads the file rather than guessing.

**Errors and warnings are different things.** An error means the row did not go
in and says why, by the row number the person's own spreadsheet shows. A warning
means it did, but something in it could not be used — an unreadable email
address, a supplier we have never heard of. Rolling the second into the first
has people chasing rows that are already safely in; leaving it out loses data
quietly.

**Running the same file twice is safe.** Records match on their ERPNext id
first, then email, then name — product code for items, invoice number for
invoices. A second run reports them as already there, or overwrites them if
that is what was asked for. Two rows of the same file claiming the same record
is an error on the second, naming the first.

**Five things load:** customers, suppliers, product categories, products and
sales invoices, in that order, because each can point at the ones above it by
name. A category a product names but does not have is created; a supplier it
names and we do not have is a warning, not a failure.

Three decisions worth keeping:

- **Invoices keep their numbers and are never rewritten.** An invoice is a
  statement of what was owed on a day. `nextDocumentNumber` already advances
  past numbers introduced from outside, so the workspace's own series heals
  itself around them.
- **Imported invoices do not move stock.** The opening quantity on the products
  file is what is on the shelf today, after those sales. Taking them off again
  would count them twice.
- **Opening stock arrives with the movement that explains it**, as a stock
  adjustment labelled "Opening balance, imported", so the history reconciles
  rather than starting from a number with nothing behind it.

`ImportRun` keeps every run and its refused rows, downloadable as a CSV to work
through beside the original file. The page is reachable by anyone who may create
in one of those five modules, not by owners alone — the person who knows the
data is rarely the person who pays the bill.

## The assistant

Chat that reads the workspace and drafts the work. See
[ASSISTANT.md](ASSISTANT.md); the shape of it is worth repeating here.

**It cannot write.** A drafting tool resolves the names, fills in what was left
out, runs the same Zod schema the form runs and totals the document with the
same function the invoice page uses — then stops, with the filled-in form on
screen and a button under it. Confirming runs the ordinary server action, so the
permission check, the stock check, the numbering, the notification and the
activity log are not reimplemented and cannot drift. `assistant_proposals` holds
the staged input server-side, where the browser cannot edit it, and only the
person it was drafted for can confirm one.

**It never sees an identifier.** No tool takes or returns a database id; the
model works in names, and a resolver turns a name into a row or into a question
("which Ama?"). A model that has never seen an id cannot invent one, and the
workspace's identifiers never reach a provider's logs.

**The permission gate is real.** Which of the fifteen tools the model is offered
is narrowed to what the person holds, and every call is checked again on the way
in — a tool list is a hint to a language model, and a hint is not access
control. An employee is offered four tools; calling a fifth by name is refused.

**Everything is stored as it was sent.** `chat_messages` holds the provider's
own content blocks verbatim, because the next turn replays them and a summary
would not replay. The screen renders something else entirely from the same rows.

Smaller decisions that earn their place:

- **Opus 5, adaptive thinking, summarised.** The reasoning appears in grey above
  the answer, so a turn that takes twenty seconds looks like work rather than a
  hang. Tool calls announce themselves in the same words the finished trace uses.
- **Server-side refusal fallbacks** are on, so a safety decline on a business
  question is answered by a second model rather than stopping.
- **The system prompt and the tool list are cached.** They are identical on every
  turn and together are most of what is sent; the tool list is sorted by name so
  a reshuffle cannot invalidate the prefix.
- **A route handler, not a server action**, because it streams. One JSON object
  per line — not Server-Sent Events, whose reconnection semantics are exactly
  what a half-finished answer should not have.
- **No `eager_input_streaming`.** It exists so a large tool input streams as it
  is generated; the largest thing here is an invoice with a few lines, so there
  is no latency to win and the tolerant parser it turns on can hand back a
  silently truncated input.
- **A 200-line Markdown renderer** rather than a Markdown library: a reply is a
  few sentences and a small table, and it builds React elements, so nothing the
  model writes — or a customer's own notes quoted back through it — can become
  markup that runs.
- **Off unless configured.** No key, no menu item, no page. Not a page that
  apologises.

## Known gaps, deliberately left

- **No trial-ending reminder.** The trial email says days remaining are on the
  billing page rather than promising a reminder nothing sends.
- **No "password changed" notice.** Conventional, and missing.
- **Ownership cannot be transferred.** The owner row is immovable from
  `settings/users`, which is safe but means a departing founder needs a hand at
  the database.
- **Plan prices are placeholders.** `lib/config/plans.ts` still carries the
  figures used while building (Starter 1/3, Business 2/7). They are now in GHS
  and must be set to the real numbers before the Paystack plans are created,
  because the two have to match exactly.
- **No dunning beyond the first notice.** A failed renewal marks the workspace
  past due and notifies the owner once. Paystack's own retries continue; we send
  nothing further and take nothing away.
- **No invoice or receipt of our own.** Paystack emails the receipt. Adwuma360
  keeps the ledger but does not issue a document for it.
- **The importer does not read Excel.** A workbook has to be saved as CSV first.
  It recognises one that has not been and says so, which is most of the value,
  but it is a step somebody has to take.
- **Purchase orders, bills, expenses and employees cannot be imported.** The
  five that can are what a migration needs to trade the next day; the rest are
  the same pattern again when they are wanted.
- **An imported invoice's paid amount is not a payment record.** The balance
  owing and every figure derived from it are right; there is nothing in the
  payments ledger behind it, because we do not know when or how it was paid.
- **The assistant has never spoken to the real API.** It was built and verified
  against a local stand-in that speaks the streaming wire format — the loop, the
  tools, the permission gate, the drafts and the confirmations are all proven
  end to end, and the request shape itself is not. The first live conversation
  is the test that has not been run.
- **Assistant usage is not metered per workspace.** Every message is billed to
  whoever holds the API key, for every tenant, with no cap. The tokens are
  recorded per message, so the sum is there to be read; nothing acts on it.
- **The assistant cannot edit or cancel anything.** It drafts new records only.
  Changing an invoice or voiding a payment is done on the page, deliberately.
- **`hero.jpg`'s licence is unverified.** The watermark noted here earlier is
  gone, so the file has been replaced at some point, but nobody has recorded
  where it came from or under what terms. Worth establishing before it is
  relied on commercially.
- **No content beyond the landing page and pricing.** Nothing ranks for a
  competitive term on four pages of marketing copy, however well marked up.
- **Company details in `lib/config/brand.ts` are placeholders** — registered
  name, address and tax number appear on invoices and should be replaced.

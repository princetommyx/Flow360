# Adwuma360 — architecture

A multi-tenant ERP/CRM for small and mid-sized businesses. This document is the
map: what the layers are, where a given concern lives, and the rules that keep
the codebase consistent as modules are added.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4 with a token-based design system |
| Components | Radix primitives wrapped in a local `components/ui` library (shadcn-style, owned in-repo) |
| Database | PostgreSQL |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Auth | Auth.js (NextAuth v5), credentials provider, JWT sessions |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide |

## Layers

```
src/
  app/                    routes only — thin; data comes from server/
    (marketing)/          public site
    (auth)/               sign in, sign up, password recovery, verification
    (app)/                authenticated shell: sidebar, header, every module
    api/                  route handlers (auth, file responses)
  components/
    ui/                   design-system primitives (no business logic)
    data-table/           the one reusable table: search, filter, sort, page
    charts/               Recharts wrappers bound to design tokens
    layout/               app shell: sidebar, header, switcher, palette
    marketing/            public-site pieces
    shared/               cross-module building blocks (StatCard, EmptyState, …)
    brand/                logo and runtime brand theming
  lib/                    framework-free helpers
    config/brand.ts       the single branding/locale/numbering source of truth
    money.ts              money maths — the only place totals are calculated
    date.ts               period presets and formatting
    permissions.ts        the RBAC catalogue and role templates
    query.ts              URL-driven list state (search/filter/sort/page)
    status.ts             status enum → label + colour
    navigation.ts         sidebar structure (plain serialisable data)
  server/
    tenant.ts             session → organization → permissions (the guard)
    services/             business logic, reusable and framework-free
    actions/              'use server' entry points; validate → authorise → act
  generated/prisma/       Prisma client output (git-ignored, built on install)
```

### The one rule about data flow

Pages are server components. They call `requirePermission(...)` first, then a
service in `server/services/`, then render. Mutations go through a server action
in `server/actions/`, which always does the same three things in order:

1. `requirePermission()` — authenticate, resolve the tenant, check the permission
2. Zod `safeParse` on the raw input
3. Act inside a transaction, then `revalidatePath`

Client components exist only where interaction demands it (forms, menus,
charts, the command palette) and never fetch data directly.

## Multi-tenancy

Every business-owned table carries `organizationId`. Access is resolved once per
request in `server/tenant.ts`:

- the session gives a `userId`
- memberships are loaded for that user, filtered to `ACTIVE`
- the active organization comes from an **httpOnly** cookie, and is only honoured
  if the user actually holds a membership for it — a forged cookie widens nothing
- the role's permissions become the request's permission list

`getTenantContext()` is wrapped in React's `cache()`, so a layout, a page and
five server components share one set of queries.

## Permissions

A permission key is `<module>.<action>` — for example `invoices.create`. The
five actions are view / create / edit / delete / export. Six role templates
(owner, admin, manager, accountant, sales, employee) are seeded per organization
and are editable afterwards. Owners additionally hold the `*` wildcard.

Guards:
- `requirePermission(key)` in pages and actions — throws `AuthorizationError`
- `filterNavByPermissions()` hides navigation the member cannot use

Hiding UI is a convenience; the server check is the actual control.

## Money

`lib/money.ts` owns all arithmetic. `calculateLine` and `calculateDocumentTotals`
are used by invoices, quotations, purchase orders, bills **and the seed script**,
so a total can never disagree between two screens. Order of operations: line
subtotal → line discount → document discount (spread proportionally) → tax →
shipping. Everything rounds to 2dp at each step.

Money is stored as `Decimal(18,2)` and crosses to the client as a plain number
of major units via `toNumber`.

## Document numbering

`server/numbering.ts` mints numbers such as `INV-2026-00001` from a per-
organization, per-type, per-year counter row, incremented atomically inside the
caller's transaction — concurrent creates cannot collide. Prefix, padding and
whether the year appears are configurable per organization.

## Branding

`lib/config/brand.ts` holds the product name, colours, currency, country,
numbering defaults and company facts, each overridable by a `NEXT_PUBLIC_*`
environment variable. `<BrandStyle />` writes the two brand hues as CSS custom
properties; every brand-coloured token in `globals.css` derives from them via
`color-mix`, so re-theming touches no components. Organizations can override the
hues in company settings.

## Importing

`lib/import/datasets.ts` declares what can be loaded and, per field, the names
other systems give it; `lib/import/mapping.ts` matches those names to columns
and reads cells into types; `server/services/import.ts` plans every row against
the database before writing any of it. The layering is the point: the first two
are pure and testable without a database, and the third is the only one that
writes.

A dataset with `groupBy` describes a file with one row per line — ERPNext writes
a document's own fields on the first of its rows and blanks on the rest — so a
row whose grouping cell is empty joins the record above it.

Nothing about a row's fate is decided while writing. The plan is built first
(`create`, `update`, `skip`, `error`), which is what lets the preview show
exactly what the import will do and the import do exactly what the preview
showed. See [MIGRATING.md](MIGRATING.md).

## Lists

List pages keep their state in the URL (`q`, `page`, `perPage`, `sort`, `dir`,
plus per-module filters), parsed by `lib/query.ts`. That keeps list screens
server-rendered, shareable and correct under the back button. `orderByFor()`
maps a sort key through a whitelist so a crafted URL cannot order by an
arbitrary column.

## Delivery phases

| Phase | Scope | State |
|---|---|---|
| 1 | Setup, design system, auth, schema, multi-tenancy, dashboard, navigation | Done |
| 2 | Customers, products, invoices, quotations, payments | In progress |
| 3 | Inventory, purchases, suppliers, expenses | Planned |
| 4 | Employees, payroll, projects, tasks | Planned |
| 5 | Reports, PDF generation, notifications, settings | Planned |
| 6 | Landing page, pricing, responsive polish, security review, performance | Planned |

Modules not yet built render an honest placeholder rather than non-functional
controls.

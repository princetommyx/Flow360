# Adwuma360

Multi-tenant ERP/CRM for SMEs. Read `docs/ARCHITECTURE.md` first — it explains
the layers and the rules below in full.

## Commands

```bash
npm run dev         # dev server
npm run build       # prisma generate + next build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run db:migrate  # prisma migrate dev
npm run db:seed     # realistic demo data
npm run db:reset    # drop, migrate, reseed
```

Postgres must be running and `DATABASE_URL` set (see `.env.example`).

## Non-negotiables

- **Tenant scope.** Every query on a business table filters by `organizationId`
  taken from `requireTenant()` / `requirePermission()`. Never from user input.
- **Authorise on the server.** Hiding a button is not access control. Pages call
  `requirePermission()`; so does every server action, before validation.
- **Validate everything.** Server actions `safeParse` their input with a Zod
  schema from `lib/validations/` and return `ActionResult`.
- **One place for money.** Use `calculateDocumentTotals` / `calculateLine` from
  `lib/money.ts`. Do not recompute totals inline.
- **One table component.** Use `components/data-table`. List state lives in the
  URL via `lib/query.ts`.
- **Check before creating.** Look for an existing component in `components/ui`,
  `components/shared` or `components/data-table`, and an existing model in
  `prisma/schema.prisma`, before adding a new one.
- **No dead controls.** If it renders, it works. Unbuilt modules use
  `ModulePending`, not disabled buttons.
- **Server components by default.** Add `'use client'` only for interaction.
  Data crossing to a client component must be plain serialisable values — icons
  are passed by name through `components/shared/icon.tsx`, never as components.

## Design system

Tokens live in `src/app/globals.css`; brand hues come from
`lib/config/brand.ts`. Use semantic classes (`bg-surface`, `text-muted-foreground`,
`border-border`) rather than raw palette values, and `tabular` on numeric cells.

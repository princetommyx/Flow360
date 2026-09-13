# Deploying Nextora360

The app targets any Node host; the notes below use Vercel because that is the
most common target for Next.js. Nothing here is Vercel-specific except where
stated.

## 1. Provision a Postgres database

Any Postgres 14+ instance works — Neon, Supabase, Railway, RDS, or your own.

On a serverless host, **use the pooled connection string**, not the direct one.
Each serverless invocation opens its own connection, so a direct URL will
exhaust the server's connection limit under any real traffic:

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require&pgbouncer=true&connection_limit=1
```

## 2. Set environment variables

Required in every environment:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Pooled connection string, TLS required |
| `AUTH_SECRET` | `openssl rand -base64 32` — a different value per environment |
| `AUTH_URL` | The deployment origin, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same origin; used for metadata and email links |

Everything else is optional — see `.env.example`. The `NEXT_PUBLIC_BRAND_*` and
locale variables re-theme and re-label the product without a code change.

Note that `NEXT_PUBLIC_*` values are inlined into the client bundle at build
time, so changing one requires a redeploy, and no secret may ever use that
prefix.

## 3. Run migrations

Migrations are deliberately **not** part of the build. Platform builds run for
every preview and pull request, and a build step pointed at `DATABASE_URL`
would migrate whichever database that variable happens to name — including
production, from a preview build.

Run them as an explicit step instead, against the direct (non-pooled) URL:

```bash
DATABASE_URL="<direct-url>" npx prisma migrate deploy
```

Optionally load the demo dataset into a non-production database:

```bash
DATABASE_URL="<direct-url>" npm run db:seed
```

The seed **deletes all existing rows** before inserting. Never point it at
production.

## 4. Deploy

Default settings are correct — build command `npm run build`, output handled by
the Next.js framework preset. No `vercel.json` is needed.

## How the build stays database-free

`prisma generate` runs from `postinstall`, which on a platform build executes
before any runtime environment variables exist. Two things make that safe:

- `prisma.config.ts` reads `DATABASE_URL` through `process.env` and omits the
  `datasource` block entirely when it is absent. Prisma's `env()` helper throws
  on a missing variable, and generating a client needs only the schema.
- `src/lib/db.ts` constructs the Prisma client lazily, behind a `Proxy`. Next.js
  imports every route module while collecting page data, so an eagerly
  constructed client would fail the build whenever `DATABASE_URL` was absent,
  even though nothing is queried during a build.

Together these mean a build never touches the database, and a missing or
misspelled `DATABASE_URL` surfaces as a clear runtime error rather than an
opaque "failed to collect page data" build failure.

## Runtime notes

- Every page under `src/app/(app)` is dynamic: the shell calls `requireTenant()`,
  which reads cookies and the session. None of it is cached or prerendered.
- `src/proxy.ts` (the middleware) only inspects cookies. It never imports Prisma,
  so it stays on the edge runtime — the `pg` driver would not run there.
- Email is stubbed by default (`EMAIL_TRANSPORT="console"`), which prints
  verification and reset links to the server log. Implement `sendWithProvider`
  in `src/lib/mailer.ts` before relying on those flows in production.

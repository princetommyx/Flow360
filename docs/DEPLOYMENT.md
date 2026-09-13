# Deploying Flow360

The app targets any Node host; the notes below use Vercel because that is the
most common target for Next.js. Nothing here is Vercel-specific except where
stated.

## 1. Provision a Postgres database

Any Postgres 14+ instance works — Neon, Supabase, Railway, RDS, or your own.

On a serverless host, **use the pooled connection string**, not the direct one.
Each instance opens its own connections, so a direct URL will exhaust the
server's connection limit under any real traffic:

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

Do **not** append `?connection_limit=` or `?pgbouncer=`. Those are Prisma
*query-engine* parameters; this app uses the `pg` driver adapter, which ignores
them, so they would look like tuning while doing nothing.

Pool size is a driver option instead, set in `src/lib/db.ts`: one connection per
instance on Vercel, ten elsewhere. Override with `DATABASE_POOL_MAX`.

PgBouncer in transaction mode is safe here — the adapter only issues named
prepared statements when given a `statementNameGenerator`, and this app does not
supply one.

## 2. Set environment variables

Required in every environment:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Pooled connection string, TLS required |
| `AUTH_SECRET` | `openssl rand -base64 32` — a different value per environment |
| `AUTH_URL` | The deployment origin, e.g. `https://flow360.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same origin; used for metadata and email links |
| `DATABASE_POOL_MAX` | Optional. Connections per instance; defaults to 1 on Vercel, 10 elsewhere |

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

### About the origin variables

Write the real hostname, with a scheme and no angle brackets — a placeholder
pasted verbatim is not a URL and `new URL()` rejects it:

```
NEXT_PUBLIC_APP_URL=https://flow360.vercel.app     # correct
NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app  # not a URL
NEXT_PUBLIC_APP_URL=flow360.vercel.app             # no scheme
```

`src/lib/url.ts` degrades gracefully if one slips through — it tries
`NEXT_PUBLIC_APP_URL`, then Vercel's own origin, then localhost, taking the
first that parses — so a bad value costs you correct links rather than the whole
deployment. Setting it properly is still what you want: the fallback cannot know
your custom domain.

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

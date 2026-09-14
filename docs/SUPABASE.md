# Connecting Supabase

Adwuma360 stores everything in PostgreSQL through Prisma. Supabase provides that
PostgreSQL, so **no application code changes** — you are pointing `DATABASE_URL`
at Supabase instead of a local server.

To be clear about scope: this uses Supabase as the **database**. It does not use
Supabase Auth. Sign-in stays on Auth.js against the app's own `users` table,
because the whole permission model — organizations, memberships, roles,
per-module permissions — hangs off those rows. Swapping the auth provider is a
separate, much larger change; see "If you want Supabase Auth" at the end.

## 1. Create the project

In [supabase.com](https://supabase.com) → **New project**. Choose a region close
to the people using it, and save the database password it generates — it is
shown once.

## 2. Copy both connection strings

**Project Settings → Database → Connection string.** You need two, and they are
used for different things:

| Which | Where to use it | Why |
|---|---|---|
| **Transaction pooler** (port `6543`) | `DATABASE_URL` for the running app | Each serverless instance opens its own connections; the pooler is what stops them exhausting Postgres |
| **Direct connection** (port `5432`) | Migrations and seeding only | Schema changes need a real session, which the transaction pooler cannot give |

Both need `?sslmode=require`.

```
# App (pooled)
postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require

# Migrations (direct)
postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

Do not add `?pgbouncer=true` or `?connection_limit=`. Those are Prisma
query-engine parameters and this app uses the `pg` driver adapter, which ignores
them — they would look like tuning while doing nothing. Pool size is set in
`src/lib/db.ts` (`DATABASE_POOL_MAX`, default 1 on Vercel).

Supabase's transaction pooler is safe here: the adapter only issues *named*
prepared statements when given a `statementNameGenerator`, and this app does not
supply one.

## 3. Create the schema

Once, from your machine, using the **direct** URL:

```bash
DATABASE_URL="<direct-url>" npx prisma migrate deploy
```

Then confirm it worked:

```bash
DATABASE_URL="<pooled-url>" npm run db:check
```

That reports exactly what is wrong when something is — unreachable host, failed
authentication, TLS refused, missing schema, or a database with no users — rather
than leaving you to infer it from a failed login.

## 4. Create an account to sign in with

A correctly configured but empty database still cannot sign anybody in, because
there are no users yet. Either:

- **Register through the app** at `/register` — the first account owns its
  workspace; or
- **Load the demo dataset** (non-production only, it deletes all existing rows
  first):

  ```bash
  DATABASE_URL="<direct-url>" npm run db:seed
  ```

  That creates `owner@northwindsupply.example` / `Flow360Demo!` along with six
  months of realistic trading data. Change or remove that account before anyone
  real uses the deployment.

## 5. Set the environment variables on your host

| Variable | Value |
|---|---|
| `DATABASE_URL` | The **pooled** string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | Your deployment origin, e.g. `https://flow360.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | The same origin |

Redeploy afterwards — `NEXT_PUBLIC_*` values are baked in at build time.

## Why sign-in failed before

With no reachable database, `authorize()` could not look the user up. That used
to surface as *"That email and password combination is not valid"* — which sent
people off to reset a password that was never the problem. The app now separates
the two: a failure to reach the database reports that it could not reach the
service and says explicitly that it is not your password. Genuine wrong
credentials still say so.

## If you want Supabase Auth

Possible, but it is a different piece of work: Supabase would own identity, and
every `requireTenant()` call, the membership and role tables, the invitation flow
and the session shape would need rewiring onto Supabase user ids. The gain is
social logins and magic links; the cost is that the permission model stops being
self-contained. Worth doing deliberately, not as part of connecting a database.

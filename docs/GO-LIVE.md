# Getting the live site logging in

Everything is already built and deployed — the Vercel project `flow360` exists,
is linked to this repository, and its last production build succeeded. The only
thing missing is a database: with no `DATABASE_URL`, every sign-in fails with
*"We could not reach the service to sign you in."*

Four steps, no terminal needed. Budget ten minutes.

---

## 1. Create a free Postgres

Either provider is fine. **Neon through Vercel is fewer steps**, because Vercel
sets `DATABASE_URL` for you.

### Option A — Neon, from inside Vercel (recommended)

1. Vercel dashboard → project **flow360** → **Storage** → **Create Database**
2. Choose **Neon** (Postgres) → free plan → **Create**
3. Connect it to the **flow360** project when prompted

Vercel now injects `DATABASE_URL` into every environment automatically.

### Option B — Supabase

Follow [SUPABASE.md](./SUPABASE.md). You will copy the **pooled** connection
string (Session mode, port 6543) and paste it as `DATABASE_URL` in step 3.

---

## 2. Load the schema and the demo data

Pick whichever suits the device you are on.

### From a phone — GitHub Actions (no copy-paste)

1. Copy the **direct** connection string from your provider — on Neon that is
   `DATABASE_URL_UNPOOLED`, on Supabase the one on port 5432. Not the pooled
   one: `prisma migrate deploy` takes an advisory lock, and a pooler in
   transaction mode gives each statement a different backend, so the lock is
   never seen again. The workflow checks for this and stops rather than hanging.
2. GitHub → this repo → **Settings** → **Secrets and variables** → **Actions**
   → **New repository secret**, named `DATABASE_URL`
3. **Actions** tab → **Set up database** → **Run workflow**

The app itself keeps using the **pooled** string — that one is right for
serverless, where each instance opens its own connections. Two different
strings for two different jobs.

It applies both migrations, checks the database is reachable and complete, then
loads the demo data. It runs only when you start it, never on a push, and the
connection string stays in the secret — it is not written to the logs.

If the database already holds a company, the demo step stops rather than
running: the seed clears every table first, so it must never land on real work.
Re-run with *load demo data* unchecked to apply migrations only.

### From a computer — a SQL console or psql

Paste [`prisma/deploy/flow360-setup.sql`](../prisma/deploy/flow360-setup.sql)
into your provider's SQL editor and run it — schema, migration history and demo
data in one transaction.

The same content is also split, if you want the schema without the demo data:

- [`prisma/deploy/01-schema.sql`](../prisma/deploy/01-schema.sql) — tables and migration history
- [`prisma/deploy/02-demo-data.sql`](../prisma/deploy/02-demo-data.sql) — the demo companies

Or, with the repo checked out:

```bash
DATABASE_URL="<your-url>" npx prisma migrate deploy
DATABASE_URL="<your-url>" npm run db:seed
```

> All of these expect an **empty** database. They are first-time installers,
> not reset scripts.

---

## 3. Set the environment variables

Vercel → project **flow360** → **Settings** → **Environment Variables**.
Add each one to **all three** environments (Production, Preview, Development):

| Name | Value |
|---|---|
| `DATABASE_URL` | the **pooled** connection string — **skip this if you used Option A**, the Neon integration already set it |
| `AUTH_SECRET` | `XmmGgyS5BhbHBYkbVc2edQociITayk+59d5auwYKCvk=` |
| `AUTH_URL` | `https://flow360-puce.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://flow360-puce.vercel.app` |
| `PLATFORM_ADMIN_EMAILS` | your own sign-in address, so you can open the operator console |

`PLATFORM_ADMIN_EMAILS` is how the first operator of Adwuma360 is created: the
addresses listed there can open `/admin`, whatever the database says. Everyone
else is granted from inside the console, which sets a flag on their account.
Keep at least one address listed, because it is also the way back in if the
last flag is ever revoked by mistake. It grants nothing inside a customer's
workspace.

That `AUTH_SECRET` was generated for this deployment. Treat it as a password —
if it ever leaks, replace it with `openssl rand -base64 32` and redeploy.

`NEXT_PUBLIC_*` values are baked into the browser bundle at build time, so
changing one needs a redeploy (step 4) — and no secret may ever carry that
prefix.

---

## Turning on Google sign-in

Optional. Without it the button simply does not appear, rather than failing.

1. **console.cloud.google.com** → APIs & Services → Credentials → Create
   credentials → **OAuth client ID** → Web application.

2. Under **Authorised redirect URIs**, add one line per origin you sign in
   from. The path is fixed by Auth.js and must match exactly:

   ```
   https://adwuma360.online/api/auth/callback/google
   https://flow360-puce.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

3. Put the two values in Vercel as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`,
   in all three environments, and redeploy.

Only an address Google has verified is accepted. A first sign-in creates the
account and lands on `/onboarding`, which asks for the business name, country
and phone and then builds the workspace. An address that already has an
Adwuma360 account signs into that account instead, so somebody who registered
with a password can start using the Google button and keep everything.

---

## Creating a staff account

Staff are not customers. `/register` creates a *workspace*, so an account made
that way owns a company that then sits in the list it is supposed to be
policing. A staff account belongs to no workspace at all.

1. **Settings → Secrets and variables → Actions → New repository secret.**
   Name it `PLATFORM_ADMIN_PASSWORD`, and set it to the password the operator
   will sign in with: at least 10 characters, with a capital, a small letter
   and a number. A secret rather than a form field, because workflow inputs are
   shown in plain text on the run page and kept in its history.

2. **Actions → Create platform operator → Run workflow.** Give the email
   address and the person's name. The address does not need to exist yet.

3. Sign in at `/login` with that address and the password. There is no
   workspace to land in, so it goes to a page that says so and offers a link
   straight into the console.

Running it again for the same address updates that account, so it is also how
you reset a forgotten staff password: change the secret, run it again.

---

## 4. Redeploy

Environment variables only reach a build that starts after they are saved, so
the existing deployment will not pick them up.

Vercel → **Deployments** → the most recent one → **⋯** → **Redeploy**.

---

## Then sign in

<https://flow360-puce.vercel.app/login>

| Account | Password | What it shows |
|---|---|---|
| `owner@northwindsupply.example` | `Flow360Demo!` | Owner of the main demo company — full access, 18 days left on trial |
| `nadia@northwindsupply.example` | `Flow360Demo!` | Manager — reduced permissions |
| `clara@northwindsupply.example` | `Flow360Demo!` | Accountant |
| `sophie@northwindsupply.example` | `Flow360Demo!` | Sales |
| `ben@northwindsupply.example` | `Flow360Demo!` | Employee — most modules hidden |
| `rosa@harbourfitouts.example` | `Flow360Demo!` | A **separate company** — proves tenant isolation, 4 days left on trial so the trial warnings show |

Signing up with a fresh email also works and gives you an empty workspace on a
30-day trial. Email is not required to get in — confirmation codes are written
to the server log rather than sent, because no mail provider is connected yet.

---

## If sign-in still fails

The error message distinguishes the two causes deliberately:

- *"That email and password combination is not valid"* — the database is
  reachable; the credentials are wrong.
- *"We could not reach the service to sign you in"* — `DATABASE_URL` is
  missing, wrong, or step 4 was skipped.

Vercel → **Deployments** → the deployment → **Runtime Logs** shows the
underlying error.

---

## Housekeeping

Three Vercel projects point at this repository — `flow360`, `flow360-3clq` and
`flow360-3yic` — from earlier attempts. Only `flow360` is set up here; deleting
the other two (Settings → Advanced → Delete Project) avoids confusion about
which URL is current.

The repository's default branch is `claude/eager-dijkstra-u81b8k`. Switching it
to `main` under GitHub → Settings → Branches makes the production deployment
track `main` instead.

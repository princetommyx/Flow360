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

Open your provider's SQL editor:

- **Neon** → the database → **SQL Editor**
- **Supabase** → **SQL Editor** → **New query**

Paste the entire contents of [`prisma/deploy/flow360-setup.sql`](../prisma/deploy/flow360-setup.sql)
and run it.

It creates all 39 tables, records both migrations as applied (so a future
`prisma migrate deploy` picks up correctly from here), and loads the demo
dataset. It runs in a single transaction, so it either fully succeeds or
changes nothing.

> Run it on an **empty** database only. It is a first-time installer, not a
> reset script.

---

## 3. Set the environment variables

Vercel → project **flow360** → **Settings** → **Environment Variables**.
Add each one to **all three** environments (Production, Preview, Development):

| Name | Value |
|---|---|
| `DATABASE_URL` | your pooled connection string — **skip this if you used Option A**, Vercel already set it |
| `AUTH_SECRET` | `XmmGgyS5BhbHBYkbVc2edQociITayk+59d5auwYKCvk=` |
| `AUTH_URL` | `https://flow360-puce.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://flow360-puce.vercel.app` |

That `AUTH_SECRET` was generated for this deployment. Treat it as a password —
if it ever leaks, replace it with `openssl rand -base64 32` and redeploy.

`NEXT_PUBLIC_*` values are baked into the browser bundle at build time, so
changing one needs a redeploy (step 4) — and no secret may ever carry that
prefix.

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
30-day trial. Email is not required to get in — verification links are written
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

# Generated deployment SQL

`flow360-setup.sql` is a **generated** first-time installer for a hosted
database, for people who have no local Postgres tooling: paste it into a
provider's web SQL editor and it creates the schema, records both migrations as
applied, and loads the demo dataset. See [../../docs/GO-LIVE.md](../../docs/GO-LIVE.md).

It is not part of the build and nothing imports it.

The password hashes it contains are for the demo accounts only — the password
(`Flow360Demo!`) is printed by the seed and documented in the guide. No real
credential is stored here.

## Regenerating it

Against a local database that has been migrated and seeded:

```bash
npx prisma migrate deploy
npm run db:seed
pg_dump "$DATABASE_URL" --data-only --inserts --column-inserts \
  --no-owner --no-privileges --exclude-table=_prisma_migrations -f /tmp/data.sql
```

Then rebuild the file: the migration SQL from `prisma/migrations/*/migration.sql`
in order, the `_prisma_migrations` rows (ids, checksums and names must match
those migrations), and `/tmp/data.sql`, all wrapped in one `BEGIN`/`COMMIT`.

After changing it, prove it: restore into an empty database with
`psql -v ON_ERROR_STOP=1 -f flow360-setup.sql`, then confirm
`npx prisma migrate deploy` reports no pending migrations.

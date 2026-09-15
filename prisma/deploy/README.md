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

All three files are generated. After adding a migration or changing the seed:

```bash
npm run deploy:sql -- "postgresql://postgres:postgres@localhost:5432/scratch"
```

The database you name is **dropped and rebuilt**, so point it at a scratch one.
The script migrates it, seeds it, dumps the data and writes `01-schema.sql`,
`02-demo-data.sql` and `flow360-setup.sql` from the migrations on disk. The
checksums in the `_prisma_migrations` rows are SHA-256 of each `migration.sql`,
which is what lets a later `prisma migrate deploy` recognise them as applied
rather than trying to run them again.

Then prove it, into an empty database:

```bash
createdb adwuma_verify
psql "postgresql://…/adwuma_verify" -v ON_ERROR_STOP=1 -f flow360-setup.sql
DATABASE_URL="postgresql://…/adwuma_verify" npx prisma migrate deploy   # no pending migrations
DATABASE_URL="postgresql://…/adwuma_verify" npm run db:check
```

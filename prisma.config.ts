import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * `DATABASE_URL` is read through `process.env` rather than Prisma's `env()`
 * helper, which throws when the variable is unset. It has to stay optional
 * because `prisma generate` runs from `postinstall` — during a platform build
 * that happens before any runtime environment variables exist, and generating
 * the client needs only the schema. Commands that genuinely need a connection
 * (`migrate`, `db push`, `studio`) still fail loudly, with the message below.
 */
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  ...(url ? { datasource: { url } } : {}),
});

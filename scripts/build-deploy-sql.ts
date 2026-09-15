import 'dotenv/config';

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Rebuilds the paste-into-a-SQL-console installers in `prisma/deploy`.
 *
 * These files exist for someone setting up a hosted database with no local
 * Postgres tooling, and they are only useful if they agree with the migrations
 * and the seed. Keeping them in step by hand is how they fall behind, so this
 * regenerates all three from the real thing:
 *
 *   npm run deploy:sql -- "postgresql://…/scratch_db"
 *
 * The database given is dropped into and reseeded, so point it at a scratch
 * one, never at anything real. Without an argument it refuses rather than
 * guessing at DATABASE_URL.
 */

const MIGRATIONS_DIR = 'prisma/migrations';
const OUT_DIR = 'prisma/deploy';

const SETUP_HEADER = `-- Adwuma360: one-file database setup
--
-- Paste this whole file into your database provider's SQL editor and run it:
--   Supabase  ->  SQL Editor -> New query
--   Neon      ->  SQL Editor
--   Any psql  ->  \\i flow360-setup.sql
--
-- It creates the schema, records the migrations as applied (so future
-- \`prisma migrate deploy\` runs pick up from here), and loads the demo
-- dataset so the dashboard has something to show.
--
-- Safe to run on an EMPTY database only. It will fail loudly rather than
-- half-apply: everything runs in one transaction.
--
-- Demo sign-in after running this:
--   owner@northwindsupply.example  /  Flow360Demo!
--   rosa@harbourfitouts.example    /  Flow360Demo!   (second company)
`;

const DATA_HEADER = `-- Adwuma360 demo dataset.
-- Run AFTER 01-schema.sql. Loads the two demo companies and their records.
-- Safe to skip entirely: the app works fine on an empty database, you just
-- sign up for a fresh workspace instead.
`;

const HISTORY_TABLE = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id                      VARCHAR(36) PRIMARY KEY NOT NULL,
    checksum                VARCHAR(64) NOT NULL,
    finished_at             TIMESTAMPTZ,
    migration_name          VARCHAR(255) NOT NULL,
    logs                    TEXT,
    rolled_back_at          TIMESTAMPTZ,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
);`;

function migrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((entry) => /^\d{14}_/.test(entry))
    .sort()
    .map((name) => {
      const file = join(MIGRATIONS_DIR, name, 'migration.sql');
      const sql = readFileSync(file, 'utf8');
      return {
        name,
        sql: sql.replace(/\s+$/, ''),
        // Prisma stores a plain SHA-256 of the file, so `migrate deploy`
        // recognises these as already applied instead of trying them again.
        checksum: createHash('sha256').update(readFileSync(file)).digest('hex'),
      };
    });
}

function schemaBody(): string {
  const rows = migrations();

  const parts = rows.map(
    (row) => `-- ===== migration: ${row.name} =====\n${row.sql}\n`,
  );

  const history = rows
    .map(
      (row) =>
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '${row.checksum}', now(), '${row.name}', now(), 1);`,
    )
    .join('\n');

  return `${parts.join('\n')}\n-- ===== migration history =====\n${HISTORY_TABLE}\n${history}\n`;
}

function main() {
  const url = process.argv[2];
  if (!url) {
    console.error(
      'Give a scratch database URL: npm run deploy:sql -- "postgresql://…/scratch"',
    );
    console.error('It is dropped and rebuilt, so never point this at real data.');
    process.exit(1);
  }

  const run = (command: string, args: string[], env: Record<string, string> = {}) =>
    execFileSync(command, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, ...env },
    });

  // Dropped and recreated rather than reset through Prisma: `migrate reset`
  // runs the seed itself and reads its URL from the config file, and this
  // needs an empty database at a URL given on the command line.
  const target = new URL(url);
  const name = target.pathname.replace(/^\//, '');
  if (!name) throw new Error('The URL has no database name.');

  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';
  maintenance.search = '';

  console.info(`Rebuilding ${name}…`);
  run('psql', [
    maintenance.toString(),
    '-v',
    'ON_ERROR_STOP=1',
    '-q',
    '-c',
    `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`,
    '-c',
    `CREATE DATABASE "${name}"`,
  ]);

  console.info('Applying migrations…');
  run('npx', ['prisma', 'migrate', 'deploy'], { DATABASE_URL: url });

  console.info('Seeding…');
  run('npx', ['tsx', 'prisma/seed.ts'], { DATABASE_URL: url });

  console.info('Dumping the demo data…');
  // `?schema=public` is Prisma's, not libpq's: pg_dump rejects it outright.
  const dumpUrl = new URL(url);
  dumpUrl.search = '';

  const dumpPath = join(mkdtempSync(join(tmpdir(), 'adwuma-')), 'data.sql');
  execFileSync(
    'pg_dump',
    [
      dumpUrl.toString(),
      '--data-only',
      '--inserts',
      '--column-inserts',
      '--no-owner',
      '--no-privileges',
      '--exclude-table=_prisma_migrations',
      '-f',
      dumpPath,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );

  const data = readFileSync(dumpPath, 'utf8').replace(/\s+$/, '');
  const schema = schemaBody();

  writeFileSync(
    join(OUT_DIR, '01-schema.sql'),
    `${SETUP_HEADER}\nBEGIN;\n\n${schema}\nCOMMIT;\n`,
  );

  writeFileSync(
    join(OUT_DIR, '02-demo-data.sql'),
    `${DATA_HEADER}\nBEGIN;\n${data}\n\nCOMMIT;\n`,
  );

  writeFileSync(
    join(OUT_DIR, 'flow360-setup.sql'),
    `${SETUP_HEADER}\nBEGIN;\n\n${schema}\n-- ===== demo dataset =====\n${data}\n\nCOMMIT;\n`,
  );

  console.info('Wrote 01-schema.sql, 02-demo-data.sql and flow360-setup.sql.');
}

main();

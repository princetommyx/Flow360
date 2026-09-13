import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Verifies a database is reachable and correctly prepared.
 *
 * Run this against a connection string BEFORE deploying — it distinguishes the
 * failures that otherwise all look the same from the sign-in screen: wrong
 * host, wrong credentials, TLS refused, migrations never applied, or an empty
 * database with no users to sign in as.
 *
 *   DATABASE_URL="postgres://..." npm run db:check
 */
const EXPECTED_TABLES = [
  'users',
  'organizations',
  'organization_members',
  'roles',
  'permissions',
  'customers',
  'products',
  'invoices',
];

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    fail(
      'DATABASE_URL is not set.',
      'Set it in .env locally, or in your host’s environment variables.',
    );
    return;
  }

  const redacted = url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:••••@');
  console.info(`Checking ${redacted}\n`);

  if (!/^postgres(ql)?:\/\//.test(url)) {
    fail('That does not look like a PostgreSQL connection string.');
    return;
  }

  const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
  if (!isLocal && !/sslmode=/.test(url)) {
    warn('No sslmode in the URL. Hosted providers normally need ?sslmode=require.');
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const started = Date.now();
    await db.$queryRaw`SELECT 1`;
    pass(`Connected in ${Date.now() - started}ms`);
  } catch (error) {
    fail('Could not connect.', explain(error));
    await db.$disconnect();
    return;
  }

  try {
    const rows = await db.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const present = new Set(rows.map((row) => row.table_name));
    const missing = EXPECTED_TABLES.filter((table) => !present.has(table));

    if (present.size === 0) {
      fail(
        'Connected, but the database is empty.',
        'Run: DATABASE_URL="<direct-url>" npx prisma migrate deploy',
      );
      await db.$disconnect();
      return;
    }

    if (missing.length > 0) {
      fail(
        `Schema is incomplete — missing ${missing.join(', ')}.`,
        'Run: DATABASE_URL="<direct-url>" npx prisma migrate deploy',
      );
      await db.$disconnect();
      return;
    }

    pass(`Schema present (${present.size} tables)`);
  } catch (error) {
    fail('Could not read the schema.', explain(error));
    await db.$disconnect();
    return;
  }

  const [users, organizations] = await Promise.all([
    db.user.count(),
    db.organization.count(),
  ]);

  if (users === 0) {
    warn(
      'No users yet — sign-in will fail for everyone until an account exists.',
      'Either register through the app, or seed demo data with: npm run db:seed',
    );
  } else {
    pass(`${users} user${users === 1 ? '' : 's'}, ${organizations} organization${organizations === 1 ? '' : 's'}`);
  }

  // A write proves the role has more than read access, which a read-only
  // pooler user would not.
  try {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`;
    });
    pass('Transactions work (required for invoicing and payments)');
  } catch (error) {
    fail('Transactions failed.', explain(error));
  }

  await db.$disconnect();
  console.info('\nDatabase looks ready.');
}

function pass(message: string) {
  console.info(`  OK    ${message}`);
}
function warn(message: string, hint?: string) {
  console.warn(`  WARN  ${message}`);
  if (hint) console.warn(`        ${hint}`);
}
function fail(message: string, hint?: string) {
  console.error(`  FAIL  ${message}`);
  if (hint) console.error(`        ${hint}`);
  process.exitCode = 1;
}

/** Turns driver errors into something a human can act on. */
function explain(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // Prisma wraps driver errors, so match its phrasing as well as the raw codes.
  const unreachable = /Can't reach database server at `?([^`\s]+)`?/.exec(message);
  if (unreachable) {
    return `Nothing is listening at ${unreachable[1]} — check the host and port, and that the database allows connections from here.`;
  }
  if (/ENOTFOUND|EAI_AGAIN/.test(message)) {
    return 'Host not found — check the hostname in the connection string.';
  }
  if (/ECONNREFUSED/.test(message)) {
    return 'Connection refused — check the port, and that the database is running.';
  }
  if (/ETIMEDOUT|timeout/i.test(message)) {
    return 'Timed out — the host may be unreachable, or blocking this network.';
  }
  if (/password authentication failed|SASL|28P01/i.test(message)) {
    return 'Authentication failed — check the user and password.';
  }
  if (/does not exist|3D000/i.test(message)) {
    return 'That database name does not exist on the server.';
  }
  if (/SSL|self.signed|certificate/i.test(message)) {
    return 'TLS problem — most hosted providers need ?sslmode=require.';
  }
  return message;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

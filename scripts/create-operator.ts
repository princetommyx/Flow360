import 'dotenv/config';

import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Creates or updates an Adwuma360 staff account.
 *
 * Staff are not customers. This account belongs to no workspace, owns no
 * company, and can see nobody's books: it exists only to open the operator
 * console. `/register` cannot make one, because registering creates a
 * workspace, and an operator with a workspace of their own sitting in the list
 * they are supposed to be policing is the wrong shape.
 *
 *   OPERATOR_EMAIL=… OPERATOR_NAME=… OPERATOR_PASSWORD=… npm run operator
 *
 * The password comes from the environment rather than an argument so it is
 * never written to a shell history or a CI log. Running it again for the same
 * address updates that account rather than failing, which makes it the way to
 * reset a forgotten staff password too.
 */

const MIN_PASSWORD = 10;

function fail(message: string, hint?: string): never {
  console.error(`\n  FAILED  ${message}`);
  if (hint) console.error(`          ${hint}`);
  console.error('');
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) fail('DATABASE_URL is not set.');

  const email = (process.env.OPERATOR_EMAIL ?? '').trim().toLowerCase();
  const name = (process.env.OPERATOR_NAME ?? '').trim();
  const password = process.env.OPERATOR_PASSWORD ?? '';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail('OPERATOR_EMAIL is missing or is not an email address.');
  }
  if (name.length < 2) {
    fail('OPERATOR_NAME is missing.', 'It is the name shown beside their actions in the operator log.');
  }
  if (password.length < MIN_PASSWORD) {
    fail(
      `OPERATOR_PASSWORD is missing or shorter than ${MIN_PASSWORD} characters.`,
      'Set it as a repository secret so it never reaches a log.',
    );
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    fail(
      'OPERATOR_PASSWORD needs a lowercase letter, an uppercase letter and a number.',
      'The sign-in form enforces the same rule, so a weaker one could not be reset later.',
    );
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, isPlatformAdmin: true, memberships: { select: { id: true } } },
    });

    const passwordHash = await hash(password, 12);

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        isPlatformAdmin: true,
        isActive: true,
        // The address is proved by whoever can run this, so there is no
        // confirmation email to chase before the account can be used.
        emailVerified: new Date(),
      },
      update: {
        name,
        passwordHash,
        isPlatformAdmin: true,
        isActive: true,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, name: true },
    });

    // Written as the actor on itself: the first operator has nobody else to
    // record it, and an unexplained account is worse than a circular one.
    await db.platformAuditLog.create({
      data: {
        actorUserId: user.id,
        action: existing ? 'staff.reset' : 'staff.create',
        targetType: 'user',
        targetId: user.id,
        summary: existing
          ? `Reset the staff account ${user.email} from the repository`
          : `Created the staff account ${user.email} from the repository`,
      },
    });

    console.info('');
    console.info(existing ? '  Updated an existing account.' : '  Created a new account.');
    console.info(`  Email             ${user.email}`);
    console.info(`  Name              ${user.name}`);
    console.info(`  Operator console  yes`);
    console.info(
      `  Workspaces        ${existing?.memberships.length ?? 0}` +
        (existing?.memberships.length ? ' (this address is also a customer)' : ' (staff only)'),
    );
    console.info('');
    console.info('  Sign in with that address and open /admin.');
    console.info('');
  } finally {
    await db.$disconnect();
  }
}

main();

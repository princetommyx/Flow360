/**
 * Prints the number of organizations in the database, or `0` if the schema is
 * not there yet.
 *
 * Used as a guard before seeding: the seed clears every table first, so it
 * must never run over a database that already holds someone's work.
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    console.log(await db.organization.count());
  } catch (error) {
    // No schema yet is the ordinary "brand new database" case, not a failure.
    const code = (error as { code?: string }).code;
    if (code === 'P2021' || /does not exist/i.test(String(error))) {
      console.log(0);
    } else {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  } finally {
    await db.$disconnect();
  }
}

void main();

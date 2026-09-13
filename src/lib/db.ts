import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * The Prisma client.
 *
 * Construction is deferred until the first property access. Next.js imports
 * every route module while collecting page data at build time, so creating the
 * client eagerly would make a build fail whenever `DATABASE_URL` is absent —
 * even though nothing is actually queried during the build. Deferring keeps
 * builds database-free and turns a missing URL into a clear runtime error.
 *
 * The instance is cached on `globalThis` because dev-mode hot reloading
 * re-evaluates modules, which would otherwise exhaust the connection pool.
 */
function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it to your environment (see .env.example).',
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = createClient();
    // Cache in every environment: serverless instances are reused between
    // invocations, so one client per process is correct there too.
    globalForPrisma.prisma = client;
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getClient();
    const value = Reflect.get(client, property, receiver);
    // Model delegates are objects; `$transaction` and friends are functions
    // that need `this` bound back to the real client.
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has(_target, property) {
    return Reflect.has(getClient(), property);
  },
});

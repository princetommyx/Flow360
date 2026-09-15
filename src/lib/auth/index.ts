import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'node:crypto';

import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations/auth';

import { authConfig } from './config';

/**
 * Google sign-in is only offered when it is actually configured. Without
 * credentials the provider would render a button that fails on click, so it is
 * omitted entirely and `googleEnabled` tells the UI not to show it.
 */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

const providers: NextAuthConfig['providers'] = [
  Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Returning null means "bad credentials". Anything that goes wrong
        // reaching the database must NOT come back as null, or a broken
        // deployment would tell every user their password is wrong. Letting it
        // throw surfaces a CallbackRouteError, which loginAction reports as a
        // service problem instead.
        let user: {
          id: string;
          name: string;
          email: string;
          passwordHash: string;
          avatarUrl: string | null;
          isActive: boolean;
        } | null;

        try {
          user = await db.user.findUnique({
            where: { email: parsed.data.email },
            select: {
              id: true,
              name: true,
              email: true,
              passwordHash: true,
              avatarUrl: true,
              isActive: true,
            },
          });
        } catch (error) {
          throw new Error('DATABASE_UNAVAILABLE', { cause: error });
        }

        // Compare against a dummy hash when the user is missing so the
        // response time does not reveal whether the address exists.
        const hash =
          user?.passwordHash ??
          '$2b$12$0000000000000000000000000000000000000000000000000000';
        const valid = await compare(parsed.data.password, hash);

        if (!user || !valid || !user.isActive) return null;

        // Best-effort: a failure to stamp the login must not block sign-in.
        try {
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch {
          // Ignored deliberately.
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
];

if (googleEnabled) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

/**
 * Turns a Google sign-in into an account in this database.
 *
 * There is no Auth.js adapter here, because sessions are JWTs and everything
 * the app reads hangs off `users.id`. Without this callback a Google sign-in
 * would succeed and then go nowhere: the token would carry Google's own
 * identifier, no membership would resolve against it, and the person would be
 * bounced out of every page in the product.
 *
 * Matching an existing account by email is deliberate but conditional. Google
 * tells us whether it has verified the address, and only a verified one is
 * allowed to land on an account that already exists — otherwise anyone able to
 * create a Google account claiming an address could walk into the workspace
 * belonging to it.
 */
async function resolveGoogleUser(
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null },
  profile: { email_verified?: boolean; picture?: string } | undefined,
): Promise<boolean> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return false;

  if (profile?.email_verified === false) {
    // Surfaced on the sign-in page as a refusal rather than a crash.
    return false;
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, isActive: true, name: true, avatarUrl: true },
  });

  if (existing) {
    if (!existing.isActive) return false;

    await db.user.update({
      where: { id: existing.id },
      data: {
        lastLoginAt: new Date(),
        // Google has proved the address, so an account that never confirmed
        // by email is confirmed now.
        emailVerified: new Date(),
        // Their own name and picture win over Google's, once they have set one.
        avatarUrl: existing.avatarUrl ?? user.image ?? null,
      },
    });

    // The JWT must carry our id, not Google's, or nothing downstream resolves.
    user.id = existing.id;
    user.name = existing.name;
    return true;
  }

  const created = await db.user.create({
    data: {
      email,
      name: user.name?.trim() || email.split('@')[0],
      // The column is not nullable and this account signs in through Google.
      // A random value nobody holds is safer than an empty string: the way to
      // add a password later is the reset flow, which replaces this.
      passwordHash: await hash(randomBytes(32).toString('base64url'), 12),
      avatarUrl: user.image ?? null,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
    select: { id: true, name: true },
  });

  user.id = created.id;
  user.name = created.name;
  return true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true;

      try {
        return await resolveGoogleUser(user, profile as never);
      } catch (error) {
        // Returning false here shows the sign-in page's error rather than a
        // stack trace, and leaves no half-made account behind.
        console.error('Google sign-in could not be completed', error);
        return false;
      }
    },
  },
});

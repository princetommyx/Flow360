import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcryptjs';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
});

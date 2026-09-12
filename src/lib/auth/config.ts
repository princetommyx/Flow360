import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe portion of the Auth.js configuration.
 *
 * Anything that pulls in Node-only modules (bcrypt, Prisma) lives in
 * `lib/auth/index.ts` instead, so middleware stays on the edge runtime.
 */
export const authConfig = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/dashboard',
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = (user as { avatarUrl?: string | null }).avatarUrl ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.picture ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

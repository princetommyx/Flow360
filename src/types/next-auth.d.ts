import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      avatarUrl?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    avatarUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    picture?: string | null;
  }
}

export {};

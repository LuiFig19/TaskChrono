'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Point the client to our Next.js auth routes
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api/auth` : '',
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

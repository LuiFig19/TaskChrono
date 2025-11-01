import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/better-auth';

export async function getApiSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function requireApiAuth() {
  const session = await getApiSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), userId: null };
  }
  return { error: null, userId: session.user.id };
}

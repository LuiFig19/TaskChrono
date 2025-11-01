import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/better-auth';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async () => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });

    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  } catch {
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  }
});

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/better-auth';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
    });
  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e.message }, { status: 500 });
  }
});

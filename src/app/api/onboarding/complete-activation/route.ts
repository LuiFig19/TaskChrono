import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/better-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (req: Request) => {
  try {
    const { token } = await req.json().catch(() => ({}) as any);

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Decode the activation token
    let payload: { userId: string; orgId: string; exp: number };
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Check expiration
    if (Date.now() > payload.exp) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already has a valid session
    const existingSession = await auth.api.getSession({ headers: await headers() });

    if (existingSession?.user?.id === payload.userId) {
      return NextResponse.json({ success: true, hasSession: true });
    }

    // If user has a password, they need to log in
    if (user.passwordHash) {
      return NextResponse.json({
        success: false,
        requiresLogin: true,
        email: user.email,
      });
    }

    // No password (OAuth user) - can't auto-login
    return NextResponse.json({
      success: false,
      requiresLogin: true,
      email: user.email,
    });
  } catch (e: any) {
    logger.error({ err: e }, 'Activation error');
    return NextResponse.json(
      { error: e?.message || 'Failed to complete activation' },
      { status: 500 },
    );
  }
});

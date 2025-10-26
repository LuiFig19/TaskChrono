import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { token } = await req.json().catch(() => ({} as any))
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Decode the activation token
    let payload: { userId: string; orgId: string; exp: number }
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8')
      payload = JSON.parse(decoded)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Check expiration
    if (Date.now() > payload.exp) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }

    // Get user credentials to re-authenticate
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    })

    if (!user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create a new session by calling Better Auth's session creation
    // We'll use the internal session creation since we already verified the user
    const session = await auth.api.getSession({
      headers: await headers(),
      cookies: await cookies(),
    })

    // If already has a valid session for this user, just return success
    if (session?.user?.id === payload.userId) {
      return NextResponse.json({ success: true, alreadyAuthenticated: true })
    }

    // Otherwise, user needs to log in again
    return NextResponse.json({ 
      success: false, 
      requiresLogin: true,
      email: user.email,
      callbackUrl: '/dashboard'
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to restore session' }, { status: 500 })
  }
}


import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { auth } from '@/lib/better-auth'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      cookies: await cookies(),
    })
    
    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    
    return NextResponse.json({ 
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
    })
  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e.message }, { status: 500 })
  }
}


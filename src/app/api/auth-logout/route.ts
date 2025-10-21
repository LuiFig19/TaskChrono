import { NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
    
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:5000'));
  } catch {
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:5000'));
  }
}

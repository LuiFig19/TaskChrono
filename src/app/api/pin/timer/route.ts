import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { error, userId } = await requireApiAuth()
    if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
    
    const pref = await prisma.userPreference.findUnique({ where: { userId } })
    const order = (pref?.dashboardWidgets as unknown as string[] | null) ?? []
    const next = order.includes('timer_active') ? order : [...order, 'timer_active']
    await prisma.userPreference.upsert({ where: { userId }, update: { dashboardWidgets: next as unknown as any }, create: { userId, dashboardWidgets: next as unknown as any } })
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}



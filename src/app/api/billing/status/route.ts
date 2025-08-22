import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  })
  if (!membership?.organization) return NextResponse.json({ locked: false })
  const org = membership.organization

  const created = org.createdAt
  const trialEnd = org.trialEndsAt ?? addDays(created, 14)
  const now = new Date()
  const locked = org.planTier === 'FREE' && now > trialEnd

  const membersCount = await prisma.organizationMember.count({ where: { organizationId: org.id } })

  // Expose unit pricing for client display (in cents)
  const prices = {
    BUSINESS: Number(process.env.NEXT_PUBLIC_PRICE_BUSINESS_CENTS || '500'),
    ENTERPRISE: Number(process.env.NEXT_PUBLIC_PRICE_ENTERPRISE_CENTS || '1200'),
  }
  return NextResponse.json({
    locked,
    plan: org.planTier,
    trialEndsAt: trialEnd.toISOString(),
    membersCount,
    prices,
  })
}



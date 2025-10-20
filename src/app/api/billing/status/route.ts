import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export async function GET() {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  })
  if (!membership?.organization) {
    const prices = {
      BUSINESS: Number(process.env.NEXT_PUBLIC_PRICE_BUSINESS_CENTS || '500'),
      ENTERPRISE: Number(process.env.NEXT_PUBLIC_PRICE_ENTERPRISE_CENTS || '1200'),
    }
    return NextResponse.json({ locked: false, plan: 'FREE', trialEndsAt: new Date().toISOString(), membersCount: 1, prices })
  }
  const org = membership.organization

  const created = org.createdAt
  const trialEnd = org.trialEndsAt ?? addDays(created, 14)
  const now = new Date()
  // Free tier should NEVER be locked. Only non-free plans get the trial lock.
  const locked = org.planTier !== 'FREE' && now > trialEnd

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



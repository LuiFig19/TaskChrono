import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ entries: [], timers: [] })
  const entries = await prisma.timeEntry.findMany({ where: { organizationId, userId }, orderBy: { startedAt: 'desc' } })
  const timers = await prisma.timer.findMany({ where: { organizationId, userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    entries: entries.map(e => ({
      id: e.id,
      name: e.name,
      startedAt: e.startedAt.toISOString(),
      endedAt: e.endedAt ? e.endedAt.toISOString() : null,
      durationMin: e.durationMin ?? 0,
      timerId: e.timerId || null,
    })),
    timers: timers.map(t => ({
      id: t.id,
      name: t.name,
      tags: t.tags || [],
      finalizedAt: t.finalizedAt ? t.finalizedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    }))
  })
}



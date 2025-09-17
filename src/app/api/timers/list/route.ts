import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ entries: [], timers: [] }, { status: 401 })
  const userId = (session.user as any).id as string
  const entries = await prisma.timeEntry.findMany({ where: { userId }, orderBy: { startedAt: 'desc' } })
  const timers = await prisma.timer.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    entries: entries.map((e) => ({ id: e.id, name: e.name || 'Timer', startedAt: e.startedAt, endedAt: e.endedAt, durationMin: e.durationMin ?? 0, timerId: e.timerId })),
    timers: timers.map((t) => ({ id: t.id, name: t.name, tags: t.tags || [], createdAt: t.createdAt, finalizedAt: (t as any).finalizedAt ?? null })),
  })
}


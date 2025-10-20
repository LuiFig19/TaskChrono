import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const entries = await prisma.timeEntry.findMany({ where: { userId }, orderBy: { startedAt: 'desc' } })
  const timers = await prisma.timer.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    entries: entries.map((e) => ({ id: e.id, name: e.name || 'Timer', startedAt: e.startedAt, endedAt: e.endedAt, durationMin: e.durationMin ?? 0, timerId: e.timerId })),
    timers: timers.map((t) => ({ id: t.id, name: t.name, tags: t.tags || [], createdAt: t.createdAt, finalizedAt: (t as any).finalizedAt ?? null })),
  })
}


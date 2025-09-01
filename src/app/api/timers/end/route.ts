import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { emitToUser } from '@/lib/realtime'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ ok: false })

  let timerId: string | null = null
  try {
    const body = await request.json()
    timerId = (body?.timerId as string) || null
  } catch {
    try {
      const form = await request.formData()
      timerId = (form.get('timerId') as string) || null
    } catch {}
  }

  if (!timerId) return NextResponse.json({ ok: false, error: 'Missing timerId' }, { status: 400 })

  // Ensure the timer has at least one entry historically
  const anyEntry = await prisma.timeEntry.findFirst({ where: { organizationId, userId, timerId } })
  if (!anyEntry) return NextResponse.json({ ok: false, error: 'Timer has no entries to end' }, { status: 400 })

  // Find the latest unended entry for this timer
  const active = await prisma.timeEntry.findFirst({
    where: { organizationId, userId, timerId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
  if (active) {
    const now = new Date()
    const durationMin = Math.max(0, Math.round((now.getTime() - new Date(active.startedAt).getTime()) / 60000))
    await prisma.timeEntry.update({ where: { id: active.id }, data: { endedAt: now, durationMin } })
  }

  // Mark timer finalized
  await prisma.timer.update({ where: { id: timerId, organizationId, userId }, data: { finalizedAt: new Date() } })
  emitToUser(userId, 'timer:changed', { type: 'end', timerId })
  return NextResponse.json({ ok: true })
}



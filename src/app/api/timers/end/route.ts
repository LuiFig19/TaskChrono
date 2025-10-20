import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { emitToUser } from '@/lib/realtime'
import { broadcastActivity } from '@/lib/activity'

export async function POST(request: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ ok: false })

  let timerId: string | null = null
  const ct = request.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) {
      const body = await request.json()
      timerId = (body?.timerId as string) || null
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const text = await request.text(); const p = new URLSearchParams(text)
      timerId = p.get('timerId')
    } else {
      const form = await request.formData()
      timerId = (form.get('timerId') as string) || null
    }
  } catch {}
  if (!timerId) return NextResponse.json({ error: 'Missing timerId' }, { status: 400 })

  // Ensure timer belongs to user
  const timer = await prisma.timer.findFirst({ where: { id: timerId, organizationId, userId } })
  if (!timer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()

  // Close any active entry
  const active = await prisma.timeEntry.findFirst({ where: { organizationId, userId, timerId, endedAt: null }, orderBy: { startedAt: 'desc' } })
  if (active) {
    const durationMin = Math.max(0, Math.round((now.getTime() - new Date(active.startedAt).getTime()) / 60000))
    await prisma.timeEntry.update({ where: { id: active.id }, data: { endedAt: now, durationMin } })
  }

  // Finalize timer
  await prisma.timer.update({ where: { id: timerId }, data: { finalizedAt: now } })
  emitToUser(userId, 'timer:changed', { type: 'finalize', timerId })
  try { broadcastActivity({ type: 'timer.end', message: 'Timer ended', meta: { timerId } }) } catch {}

  return NextResponse.json({ ok: true })
}


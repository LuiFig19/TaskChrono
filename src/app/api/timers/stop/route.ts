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

  const end = new Date()
  // Support JSON, urlencoded and form submissions and accept entryId override
  let timerId: string | null = null
  let entryId: string | null = null
  const ct = request.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) {
      const body = await request.json()
      timerId = (body?.timerId as string) || null
      entryId = (body?.entryId as string) || null
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const text = await request.text(); const p = new URLSearchParams(text)
      timerId = p.get('timerId')
      entryId = p.get('entryId')
    } else {
      const form = await request.formData()
      timerId = (form.get('timerId') as string) || null
      entryId = (form.get('entryId') as string) || null
    }
  } catch {}
  // If entryId provided, close that exact entry
  if (entryId) {
    const e = await prisma.timeEntry.findUnique({ where: { id: entryId } })
    if (e && e.userId === userId && e.endedAt == null) {
      const durationMin = Math.max(0, Math.round((end.getTime() - new Date(e.startedAt).getTime()) / 60000))
      await prisma.timeEntry.update({ where: { id: e.id }, data: { endedAt: end, durationMin } })
      emitToUser(userId, 'timer:changed', { type: 'stop', entryId: e.id, timerId: e.timerId })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: true })
  }

  const where = timerId
    ? { organizationId, userId, endedAt: null, timerId }
    : { organizationId, userId, endedAt: null }
  const active = await prisma.timeEntry.findFirst({ where, orderBy: { startedAt: 'desc' } })
  if (!active) return NextResponse.json({ ok: true })
  const durationMin = Math.max(0, Math.round((end.getTime() - new Date(active.startedAt).getTime()) / 60000))
  await prisma.timeEntry.update({ where: { id: active.id }, data: { endedAt: end, durationMin } })
  emitToUser(userId, 'timer:changed', { type: 'stop', entryId: active.id, timerId })
  try { broadcastActivity({ type: 'timer.stop', message: 'Timer paused', meta: { timerId, entryId: active.id } }) } catch {}
  return NextResponse.json({ ok: true })
}




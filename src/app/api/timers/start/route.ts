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

  // Accept JSON and form submissions (robust parsing)
  let body: { name?: string; notes?: string; timerId?: string } = {}
  const ct = request.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) body = await request.json()
    else if (ct.includes('application/x-www-form-urlencoded')) { const text = await request.text(); const p = new URLSearchParams(text); body = { name: p.get('name') || undefined, notes: p.get('notes') || undefined, timerId: p.get('timerId') || undefined } }
    else { const form = await request.formData(); body = { name: (form.get('name') as string) || undefined, notes: (form.get('notes') as string) || undefined, timerId: (form.get('timerId') as string) || undefined } }
  } catch {}
  const requestedName = (body.name || '').trim().slice(0, 120)
  let timerId = body.timerId || null
  if (!timerId) {
    const timer = await prisma.timer.create({ data: { organizationId, userId, name: requestedName || 'Timer', notes: body.notes?.slice(0, 2000) } })
    timerId = timer.id
    await prisma.timeEntry.create({ data: { organizationId, userId, name: requestedName || 'Timer', timerId: timerId!, startedAt: new Date(), notes: body.notes?.slice(0, 2000) } })
  } else {
    // Resume: don't rename timer; ensure no duplicate active entry exists
    const active = await prisma.timeEntry.findFirst({ where: { organizationId, userId, timerId, endedAt: null } })
    if (!active) {
      const timer = await prisma.timer.findUnique({ where: { id: timerId } })
      const effectiveName = timer?.name || requestedName || 'Timer'
      await prisma.timeEntry.create({ data: { organizationId, userId, name: effectiveName, timerId: timerId!, startedAt: new Date() } })
    }
  }
  emitToUser(userId, 'timer:changed', { type: 'start', timerId })
  return NextResponse.json({ ok: true })
}




import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ ok: false })

  const body = await request.json().catch(() => ({})) as { name?: string; notes?: string; timerId?: string }
  const name = (body.name || 'Timer').slice(0, 120)
  let timerId = body.timerId || null
  if (!timerId) {
    const timer = await prisma.timer.create({ data: { organizationId, userId, name, notes: body.notes?.slice(0, 2000) } })
    timerId = timer.id
  }
  await prisma.timeEntry.create({ data: { organizationId, userId, name, timerId: timerId!, startedAt: new Date(), notes: body.notes?.slice(0, 2000) } })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { startTimer } from '@/app/(app)/dashboard/timers/actions'

export async function POST() {
  await startTimer(new FormData())
  return NextResponse.json({ ok: true })
}




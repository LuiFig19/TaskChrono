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

  const end = new Date()
  const body = await request.json().catch(() => ({})) as { timerId?: string }
  const where = body.timerId
    ? { organizationId, userId, endedAt: null, timerId: body.timerId }
    : { organizationId, userId, endedAt: null }
  const active = await prisma.timeEntry.findFirst({ where, orderBy: { startedAt: 'desc' } })
  if (!active) return NextResponse.json({ ok: true })
  const durationMin = Math.max(0, Math.round((end.getTime() - new Date(active.startedAt).getTime()) / 60000))
  await prisma.timeEntry.update({ where: { id: active.id }, data: { endedAt: end, durationMin } })
  return NextResponse.json({ ok: true })
}




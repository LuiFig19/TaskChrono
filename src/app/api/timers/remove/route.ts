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
  const ct = request.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) {
      const body = await request.json(); timerId = (body?.timerId as string) || null
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const text = await request.text(); const params = new URLSearchParams(text); timerId = params.get('timerId')
    } else {
      const form = await request.formData(); timerId = (form.get('timerId') as string) || null
    }
  } catch {}
  if (!timerId) return NextResponse.json({ ok: false, error: 'Missing timerId' }, { status: 400 })

  const timer = await prisma.timer.findFirst({ where: { id: timerId } })
  if (!timer || timer.userId !== userId) return NextResponse.json({ ok: false })

  // Hard delete regardless of dangling relations
  await prisma.timeEntry.deleteMany({ where: { timerId } })
  try { await prisma.timer.delete({ where: { id: timerId } }) } catch {}
  emitToUser(userId, 'timer:changed', { type: 'remove', timerId })
  return NextResponse.json({ ok: true })
}



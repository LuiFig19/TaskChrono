import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { emitToUser } from '@/lib/realtime'

export async function POST(req: Request) {
  const { error } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ ok: false })
  const { timerId, tags } = await req.json().catch(() => ({ timerId: '', tags: [] as string[] })) as { timerId: string; tags: string[] }
  if (!timerId) return NextResponse.json({ ok: false })
  await prisma.timer.update({ where: { id: timerId, organizationId, userId }, data: { tags: tags.map(t=>t.slice(0,40)).slice(0,20) } })
  emitToUser(userId, 'timer:changed', { type: 'tags', timerId })
  return NextResponse.json({ ok: true })
}



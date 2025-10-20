import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { ensureUserOrg } from '@/lib/org'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/chatStore'

export async function POST(req: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await ensureUserOrg()
  const body = await req.json().catch(()=>({})) as any
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 })
  const message = await prisma.chatMessage.findUnique({ where: { id } })
  if (!message || message.organizationId !== organizationId) return NextResponse.json({ ok: true })
  await prisma.chatLike.deleteMany({ where: { messageId: id } }).catch(()=>{})
  await prisma.chatMessage.delete({ where: { id } }).catch(()=>{})
  broadcast(organizationId!, message.channelId, 'deleted', { id })
  return NextResponse.json({ ok: true })
}



import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { broadcast } from '@/lib/chatStore'

export async function POST(req: Request) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return error
  const body = await req.json().catch(()=>({})) as any
  const messageId = String(body.messageId||'')
  if (!messageId) return error
  const userName = session.user?.name || 'User'
  try {
    await prisma.chatLike.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId, userName },
    })
  } catch {
    // If schema not migrated, skip persistence but continue broadcasting
  }
  broadcast(organizationId, (await prisma.chatMessage.findUnique({ where: { id: messageId } }))!.channelId, 'liked', { messageId, userId, userName })
  return NextResponse.json({ ok: true })
}



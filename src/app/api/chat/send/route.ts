import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { ensureUserOrg } from '@/lib/org'
import { broadcast } from '@/lib/chatStore'
import { prisma } from '@/lib/prisma'
import { broadcastActivity } from '@/lib/activity'

export async function POST(req: Request) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { organizationId } = await ensureUserOrg()
  const body = await req.json().catch(()=>({})) as any
  const channelId = String(body.channelId || 'all')
  const text = String(body.text || '').trim()
  if (!text) return error
  const userName = session.user?.name || 'User'
  const created = await prisma.chatMessage.create({
    data: { organizationId, channelId, userId, userName, text },
  })
  const msg = { id: created.id, channelId, user: { id: userId, name: userName }, text, ts: created.ts.getTime(), role: channelId==='managers' ? 'Management' : (channelId==='employees' ? 'Employee' : 'Staff') }
  broadcast(organizationId, channelId, 'message', msg)
  try { broadcastActivity({ type: 'chat.message', message: `${userName}: ${text}`, meta: { channelId } }) } catch {}
  return NextResponse.json(msg)
}


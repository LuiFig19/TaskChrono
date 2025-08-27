import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureUserOrg } from '@/lib/org'
import { broadcast } from '@/lib/chatStore'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await ensureUserOrg()
  const body = await req.json().catch(()=>({})) as any
  const channelId = String(body.channelId || 'all')
  const text = String(body.text || '').trim()
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 })
  const userId = (session.user as any).id as string
  const userName = session.user?.name || 'User'
  const created = await prisma.chatMessage.create({
    data: { organizationId, channelId, userId, userName, text },
  })
  const msg = { id: created.id, channelId, user: { id: userId, name: userName }, text, ts: created.ts.getTime(), role: channelId==='managers' ? 'Management' : (channelId==='employees' ? 'Employee' : 'Staff') }
  broadcast(organizationId, channelId, 'message', msg)
  return NextResponse.json(msg)
}


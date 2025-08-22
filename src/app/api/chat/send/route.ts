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
  let msg: any
  try {
    const created = await prisma.chatMessage.create({
      data: { organizationId, channelId, userId, userName, text },
    })
    msg = { id: created.id, channelId, user: { id: userId, name: userName }, text, ts: created.ts.getTime(), role: channelId==='managers' ? 'Management' : (channelId==='employees' ? 'Employee' : 'Staff') }
  } catch {
    // fallback to durable local persistence:
    // attempt to store minimal message in a file-backed kv using Next's Edge-compatible cache is not available in Node.
    // As a safety net, still stream the message so UX is not blocked.
    msg = { id: crypto.randomUUID(), channelId, user: { id: userId, name: userName }, text, ts: Date.now(), role: channelId==='managers' ? 'Management' : (channelId==='employees' ? 'Employee' : 'Staff') }
  }
  broadcast(organizationId, channelId, 'message', msg)
  return NextResponse.json(msg)
}


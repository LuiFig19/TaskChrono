import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastActivity } from '@/lib/activity'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const member = await prisma.teamMembership.findFirst({ where: { teamId: params.id, userId } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const list = await prisma.teamActivity.findMany({ where: { teamId: params.id, type: 'chat' }, orderBy: { createdAt: 'asc' } })
  const messages = list.map(m => ({ id: m.id, text: (m.payload as any)?.text || '', userName: (m.payload as any)?.userName || 'User' }))
  return NextResponse.json({ messages })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const member = await prisma.teamMembership.findFirst({ where: { teamId: params.id, userId } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { text?: string }
  const text = String(body.text||'').trim()
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  await prisma.teamActivity.create({ data: { teamId: params.id, type: 'chat', payload: { text, userName: user?.name || user?.email || 'User' } as any } })
  try { broadcastActivity({ type: 'chat.message', message: `${user?.name || 'User'}: ${text}`, meta: { teamId: params.id } }) } catch {}
  return NextResponse.json({ ok: true })
}



import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { broadcastActivity } from '@/lib/activity'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const { id } = await (ctx.params as any)
  const member = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const list = await prisma.teamActivity.findMany({ where: { teamId: id, type: 'chat' }, orderBy: { createdAt: 'asc' } })
  const messages = list.map(m => ({ id: m.id, text: (m.payload as any)?.text || '', userName: (m.payload as any)?.userName || 'User' }))
  return NextResponse.json({ messages })
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const { id } = await (ctx.params as any)
  const member = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { text?: string }
  const text = String(body.text||'').trim()
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  await prisma.teamActivity.create({ data: { teamId: id, type: 'chat', payload: { text, userName: user?.name || user?.email || 'User' } as any } })
  try { broadcastActivity({ type: 'chat.message', message: `${user?.name || 'User'}: ${text}`, meta: { teamId: id } }) } catch {}
  return NextResponse.json({ ok: true })
}



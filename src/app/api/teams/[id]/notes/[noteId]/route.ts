import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { broadcastActivity } from '@/lib/activity'

export async function GET(_req: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, noteId } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const note = await prisma.teamNote.findFirst({ where: { id: noteId, teamId: id } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: note.id, title: note.title, contentMd: note.contentMd || '' })
}

export async function PUT(request: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, noteId } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { title?: string; contentMd?: string }
  await prisma.teamNote.updateMany({ where: { id: noteId, teamId: id }, data: { title: body.title, contentMd: body.contentMd } })
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    await prisma.teamActivity.create({ data: { teamId: id, type: 'note.updated', actorId: userId, payload: { noteId, title: body.title, userName: user?.name || user?.email || 'User' } as any } })
    broadcastActivity({ type: 'note.updated', message: `${user?.name || 'User'} updated a note`, meta: { teamId: id, noteId } })
  } catch {}
  return NextResponse.json({ ok: true })
}



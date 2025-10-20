import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { broadcastActivity } from '@/lib/activity'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return error
  const { searchParams } = new URL(request.url)
  const pinned = searchParams.get('pinned') === 'true'
  const notes = await prisma.teamNote.findMany({ where: { teamId: id, pinned: pinned ? true : undefined }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ notes })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return error
  const body = await request.json().catch(()=>({})) as { title?: string; contentMd?: string; pinned?: boolean }
  const title = String(body.title||'Untitled').trim()
  const contentMd = String(body.contentMd||'')
  const note = await prisma.teamNote.create({ data: { teamId: id, authorId: userId, title, contentMd, pinned: !!body.pinned } })
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    await prisma.teamActivity.create({ data: { teamId: id, type: 'note.created', actorId: userId, payload: { noteId: note.id, title, userName: user?.name || user?.email || 'User' } as any } })
    broadcastActivity({ type: 'note.created', message: `${user?.name || 'User'} created a note`, meta: { teamId: id, noteId: note.id } })
  } catch {}
  return NextResponse.json({ id: note.id })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return error
  const { searchParams } = new URL(request.url)
  const noteId = String(searchParams.get('noteId') || '')
  if (!noteId) return error
  await prisma.teamNote.deleteMany({ where: { id: noteId, teamId: id } })
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    await prisma.teamActivity.create({ data: { teamId: id, type: 'note.deleted', actorId: userId, payload: { noteId, userName: user?.name || user?.email || 'User' } as any } })
    broadcastActivity({ type: 'note.deleted', message: `${user?.name || 'User'} deleted a note`, meta: { teamId: id, noteId } })
  } catch {}
  return NextResponse.json({ ok: true })
}



import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id, noteId } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const note = await prisma.teamNote.findFirst({ where: { id: noteId, teamId: id } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: note.id, title: note.title, contentMd: note.contentMd || '' })
}

export async function PUT(request: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id, noteId } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { title?: string; contentMd?: string }
  await prisma.teamNote.updateMany({ where: { id: noteId, teamId: id }, data: { title: body.title, contentMd: body.contentMd } })
  return NextResponse.json({ ok: true })
}



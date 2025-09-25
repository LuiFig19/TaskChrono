import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ notes: [] }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ notes: [] }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const pinned = searchParams.get('pinned') === 'true'
  const notes = await prisma.teamNote.findMany({ where: { teamId: id, pinned: pinned ? true : undefined }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ notes })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { title?: string; contentMd?: string; pinned?: boolean }
  const title = String(body.title||'Untitled').trim()
  const contentMd = String(body.contentMd||'')
  const note = await prisma.teamNote.create({ data: { teamId: id, authorId: userId, title, contentMd, pinned: !!body.pinned } })
  return NextResponse.json({ id: note.id })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const noteId = String(searchParams.get('noteId') || '')
  if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })
  await prisma.teamNote.deleteMany({ where: { id: noteId, teamId: id } })
  return NextResponse.json({ ok: true })
}



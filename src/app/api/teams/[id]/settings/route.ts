import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, getUserTeamRole } from '@/lib/team'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const { id } = await context.params
  const m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
  if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const t = await prisma.team.findUnique({ where: { id } })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: t.id, name: t.name, description: t.description })
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { name?: string; description?: string }
  const name = String(body.name||'').trim()
  const description = (body.description || null) as string | null
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  await prisma.team.update({ where: { id }, data: { name, description } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}



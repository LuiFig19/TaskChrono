import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, getUserTeamRole } from '@/lib/team'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
  if (!m) return error
  const t = await prisma.team.findUnique({ where: { id } })
  if (!t) return error
  return NextResponse.json({ id: t.id, name: t.name, description: t.description })
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return error
  const body = await request.json().catch(()=>({})) as { name?: string; description?: string }
  const name = String(body.name||'').trim()
  const description = (body.description || null) as string | null
  if (!name) return error
  await prisma.team.update({ where: { id }, data: { name, description } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return error
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}



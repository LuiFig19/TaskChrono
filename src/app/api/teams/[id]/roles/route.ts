import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, isAdmin } from '@/lib/team'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const roles = await prisma.teamRoleLabel.findMany({ where: { teamId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ roles })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return error
  const body = await request.json().catch(()=>({})) as { name?: string }
  const name = String(body.name||'').trim()
  if (!name) return error
  const r = await prisma.teamRoleLabel.create({ data: { teamId: id, name } })
  return NextResponse.json({ id: r.id })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return error
  const { searchParams } = new URL(request.url)
  const roleId = String(searchParams.get('roleId')||'')
  if (!roleId) return error
  await prisma.teamRoleLabel.deleteMany({ where: { id: roleId, teamId: id } })
  // Clear any member references to this label
  await prisma.teamMembership.updateMany({ where: { teamId: id, roleLabelId: roleId }, data: { roleLabelId: null } })
  return NextResponse.json({ ok: true })
}



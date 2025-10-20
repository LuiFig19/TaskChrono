import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, isAdmin } from '@/lib/team'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ roles: [] }, { status: 401 })
  const { id } = await context.params
  const roles = await prisma.teamRoleLabel.findMany({ where: { teamId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ roles })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { name?: string }
  const name = String(body.name||'').trim()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const r = await prisma.teamRoleLabel.create({ data: { teamId: id, name } })
  return NextResponse.json({ id: r.id })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const roleId = String(searchParams.get('roleId')||'')
  if (!roleId) return NextResponse.json({ error: 'Missing roleId' }, { status: 400 })
  await prisma.teamRoleLabel.deleteMany({ where: { id: roleId, teamId: id } })
  // Clear any member references to this label
  await prisma.teamMembership.updateMany({ where: { teamId: id, roleLabelId: roleId }, data: { roleLabelId: null } })
  return NextResponse.json({ ok: true })
}



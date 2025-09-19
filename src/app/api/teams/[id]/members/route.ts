import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMembers, getUserTeamRole } from '@/lib/team'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  let m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
  if (!m) {
    const t = await prisma.team.findUnique({ where: { id } })
    if (t?.createdById === userId) {
      try { await prisma.teamMembership.create({ data: { teamId: id, userId, role: 'ADMIN' as any } }) } catch {}
      m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
    }
  }
  if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const list = await prisma.teamMembership.findMany({ where: { teamId: id }, include: { user: true, roleLabel: true }, orderBy: { joinedAt: 'asc' } })
  return NextResponse.json({ members: list.map(x => ({ id: x.userId, name: x.user.name, email: x.user.email, role: x.role, roleLabelId: x.roleLabelId || null, roleLabelName: x.roleLabel?.name || null })) })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { email?: string; role?: 'ADMIN'|'MANAGER'|'MEMBER' }
  const email = String(body.email||'').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) user = await prisma.user.create({ data: { email } })
  try {
    await prisma.teamMembership.create({ data: { teamId: id, userId: user.id, role: (body.role || 'MEMBER') as any } })
  } catch {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { userId?: string; role?: 'ADMIN'|'MANAGER'|'MEMBER'; roleLabelId?: string }
  const targetId = String(body.userId||'').trim()
  const newRole = body.role ? String(body.role||'').trim().toUpperCase() as any : undefined
  if (!targetId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  await prisma.teamMembership.updateMany({ where: { teamId: id, userId: targetId }, data: { role: newRole as any, roleLabelId: body.roleLabelId ?? undefined } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { userId?: string }
  const targetId = String(body.userId||'').trim()
  if (!targetId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  await prisma.teamMembership.deleteMany({ where: { teamId: id, userId: targetId } })
  return NextResponse.json({ ok: true })
}



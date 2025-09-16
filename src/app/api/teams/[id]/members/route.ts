import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMembers, getUserTeamRole } from '@/lib/team'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const m = await prisma.teamMembership.findFirst({ where: { teamId: params.id, userId } })
  if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const list = await prisma.teamMembership.findMany({ where: { teamId: params.id }, include: { user: true }, orderBy: { joinedAt: 'asc' } })
  return NextResponse.json({ members: list.map(x => ({ id: x.userId, name: x.user.name, email: x.user.email, role: x.role })) })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const role = await getUserTeamRole(userId, params.id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { email?: string; role?: 'ADMIN'|'MANAGER'|'MEMBER' }
  const email = String(body.email||'').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) user = await prisma.user.create({ data: { email } })
  try {
    await prisma.teamMembership.create({ data: { teamId: params.id, userId: user.id, role: (body.role || 'MEMBER') as any } })
  } catch {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const role = await getUserTeamRole(userId, params.id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { userId?: string; role?: 'ADMIN'|'MANAGER'|'MEMBER' }
  const targetId = String(body.userId||'').trim()
  const newRole = String(body.role||'').trim().toUpperCase() as any
  if (!targetId || !newRole) return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
  await prisma.teamMembership.updateMany({ where: { teamId: params.id, userId: targetId }, data: { role: newRole } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const role = await getUserTeamRole(userId, params.id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { userId?: string }
  const targetId = String(body.userId||'').trim()
  if (!targetId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  await prisma.teamMembership.deleteMany({ where: { teamId: params.id, userId: targetId } })
  return NextResponse.json({ ok: true })
}



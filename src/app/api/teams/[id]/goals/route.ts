import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMembers, getUserTeamRole } from '@/lib/team'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ goals: [] }, { status: 401 })
  const userId = (session.user as any).id as string
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: params.id } })
  if (!member) return NextResponse.json({ goals: [] }, { status: 403 })
  const goals = await prisma.teamGoal.findMany({ where: { teamId: params.id }, orderBy: { updatedAt: 'desc' }, include: { keyResults: true } })
  return NextResponse.json({ goals })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const role = await getUserTeamRole(userId, params.id)
  if (!canManageMembers(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { title?: string; description?: string }
  const title = String(body.title||'').trim()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  const goal = await prisma.teamGoal.create({ data: { teamId: params.id, ownerId: userId, title, description: body.description || null } })
  return NextResponse.json({ id: goal.id })
}



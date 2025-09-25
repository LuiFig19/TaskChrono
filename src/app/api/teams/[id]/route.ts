import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireMember(userId: string, teamId: string) {
  const m = await prisma.teamMembership.findFirst({ where: { userId, teamId } })
  return m
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const { id } = await context.params
  // Ensure creator is auto-added as ADMIN if missing
  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (team.createdById === userId) {
    const m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } })
    if (!m) {
      try { await prisma.teamMembership.create({ data: { teamId: id, userId, role: 'ADMIN' as any } }) } catch {}
    }
  }
  const ok = await requireMember(userId, id)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ id: team.id, name: team.name, description: team.description })
}


import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireMember(userId: string, teamId: string) {
  const m = await prisma.teamMembership.findFirst({ where: { userId, teamId } })
  return m
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const ok = await requireMember(userId, params.id)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const team = await prisma.team.findUnique({ where: { id: params.id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: team.id, name: team.name, description: team.description })
}


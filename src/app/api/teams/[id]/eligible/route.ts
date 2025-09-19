import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ users: [] }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  const { id: teamId } = await context.params
  if (!organizationId) return NextResponse.json({ users: [] }, { status: 200 })
  // All org members not yet in this team
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })
  const teamMembers = await prisma.teamMembership.findMany({ where: { teamId } })
  const teamUserIds = new Set(teamMembers.map((m) => m.userId))
  const eligible = members
    .filter((m) => !teamUserIds.has(m.userId))
    .map((m) => ({ id: m.userId, name: m.user?.name, email: m.user?.email }))
  return NextResponse.json({ users: eligible })
}



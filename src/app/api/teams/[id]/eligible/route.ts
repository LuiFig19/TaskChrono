import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ users: [] }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  const { id: teamId } = await context.params
  if (!organizationId) return NextResponse.json({ users: [] }, { status: 200 })
  // All org members not yet in this team
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: true },
    // Avoid ordering by non-existent columns across providers; we'll sort in-memory by user name/email
  })
  const teamMembers = await prisma.teamMembership.findMany({ where: { teamId } })
  const teamUserIds = new Set(teamMembers.map((m) => m.userId))
  const eligible = members
    .filter((m) => !teamUserIds.has(m.userId))
    .map((m) => ({ id: m.userId, name: m.user?.name || '', email: m.user?.email || '' }))
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
  return NextResponse.json({ users: eligible })
}



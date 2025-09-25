import { prisma } from '@/lib/prisma'

export type TeamRole = 'ADMIN' | 'MANAGER' | 'MEMBER'

export async function getUserTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const m = await prisma.teamMembership.findFirst({ where: { userId, teamId }, select: { role: true } })
  return (m?.role as TeamRole) || null
}

export function canManageMembers(role: TeamRole | null) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function isAdmin(role: TeamRole | null) {
  return role === 'ADMIN'
}



import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, isAdmin } from '@/lib/team'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const { id } = await context.params
  const role = await getUserTeamRole(userId, id)
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const token = crypto.randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  const inv = await prisma.teamInvite.create({ data: { teamId: id, token, expiresAt, role: 'MEMBER' as any } })
  return NextResponse.json({ token: inv.token, url: `/join/team/${inv.token}`, expiresAt: inv.expiresAt })
}



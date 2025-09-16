import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserTeamRole, isAdmin } from '@/lib/team'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const role = await getUserTeamRole(userId, params.id)
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const token = crypto.randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  const inv = await prisma.teamInvite.create({ data: { teamId: params.id, token, expiresAt, role: 'MEMBER' as any } })
  return NextResponse.json({ token: inv.token, url: `/join/team/${inv.token}`, expiresAt: inv.expiresAt })
}



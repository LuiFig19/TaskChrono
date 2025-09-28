import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ teams: [] }, { status: 401 })
  const userId = (session.user as any).id as string
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })
  return NextResponse.json({
    teams: memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      description: m.team.description,
      memberCount: (m.team as any)._count?.members ?? 0,
      lastActivityAt: (m.team as any).activities?.[0]?.createdAt || (m.team as any).updatedAt,
    })),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  // Accept JSON or form submissions
  let name = ''
  let description: string | null = null
  const ctype = request.headers.get('content-type') || ''
  if (ctype.includes('application/json')) {
    const body = await request.json().catch(() => ({})) as { name?: string; description?: string }
    name = String(body.name || '').trim()
    description = body.description ? String(body.description) : null
  } else {
    const fd = await request.formData().catch(() => null)
    if (fd) {
      name = String(fd.get('name') || '').trim()
      description = (fd.get('description') ? String(fd.get('description')) : '').trim() || null
    }
  }
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const team = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({ data: { name, description, createdById: userId } })
    await tx.teamMembership.create({ data: { teamId: t.id, userId, role: 'ADMIN' as any } })
    return t
  })
  return NextResponse.json({ id: team.id })
}


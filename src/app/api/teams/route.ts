import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ teams: [] }, { status: 401 })
  const userId = (session.user as any).id as string
  const memberships = await prisma.teamMembership.findMany({ where: { userId }, include: { team: true }, orderBy: { joinedAt: 'desc' } })
  return NextResponse.json({ teams: memberships.map((m) => ({ id: m.team.id, name: m.team.name, description: m.team.description })) })
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

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'Missing org' }, { status: 400 })
  const docs = await prisma.teamDoc.findMany({ where: { organizationId }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(docs)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ error: 'Missing org/user' }, { status: 400 })
  const doc = await prisma.teamDoc.create({
    data: { organizationId, title: 'Untitled', content: '', createdById: userId }
  })
  return NextResponse.json(doc)
}



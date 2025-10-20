import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
  if (!membership?.organization) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const org = membership.organization

  // Enforce FREE tier member cap: up to 4 members
  if (org.planTier === 'FREE') {
    const count = await prisma.organizationMember.count({ where: { organizationId: org.id } })
    if (count >= 4) return NextResponse.json({ error: 'Free tier allows up to 4 members' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({})) as { email?: string; role?: 'OWNER'|'ADMIN'|'MANAGER'|'MEMBER' }
  const email = String(body.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Find or create user skeleton
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email } })
  }
  try {
    await prisma.organizationMember.create({ data: { organizationId: org.id, userId: user.id, role: body.role || 'MEMBER' as any } })
  } catch {
    return NextResponse.json({ error: 'User already a member' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}



import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(request: Request) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await request.json().catch(() => ({})) as { id?: string; role?: string }
  const id = String(body.id || '')
  const role = String(body.role || '').toUpperCase()
  if (!id || !role) return NextResponse.json({ error: 'id and role required' }, { status: 400 })

  // Only allow valid enum values
  if (!['OWNER','ADMIN','MANAGER','MEMBER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Ensure the membership belongs to the same organization
  const membership = await prisma.organizationMember.findUnique({ where: { id } })
  if (!membership || membership.organizationId !== organizationId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.organizationMember.update({ where: { id }, data: { role: role as any } })
  return NextResponse.json({ ok: true })
}



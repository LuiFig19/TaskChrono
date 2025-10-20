import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
	const { error, userId } = await requireApiAuth()
	if (error) return error
	const memberships = await prisma.organizationMember.findMany({ where: { userId }, include: { organization: true }, orderBy: { role: 'asc' } })
	return NextResponse.json({ orgs: memberships.map(m => ({ id: m.organization.id, name: m.organization.name, role: m.role })) })
}



import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
	const session = await getServerSession(authOptions)
	if (!session?.user) return NextResponse.json({ orgs: [] }, { status: 401 })
	const userId = (session.user as any).id as string
	const memberships = await prisma.organizationMember.findMany({ where: { userId }, include: { organization: true }, orderBy: { role: 'asc' } })
	return NextResponse.json({ orgs: memberships.map(m => ({ id: m.organization.id, name: m.organization.name, role: m.role })) })
}



import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { createOrgInviteToken } from '@/lib/invites'

// Invite to active organization by email.
// Creates or finds a placeholder user but does NOT auto-add membership.
// Returns a signed token that frontend can email via Gmail deep link.
export async function POST(request: Request) {
	const { error, user } = await requireApiAuth()
	if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const userId = user.id as string

	// Find inviter's active organization
	const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
	const org = membership?.organization
	if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

	// Free plan: soft cap of 4 members
	if (org.planTier === 'FREE') {
		const count = await prisma.organizationMember.count({ where: { organizationId: org.id } })
		if (count >= 4) return NextResponse.json({ error: 'Free tier allows up to 4 members' }, { status: 403 })
	}

	const body = await request.json().catch(() => ({})) as { email?: string }
	const email = String(body.email || '').trim().toLowerCase()
	if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

	// Ensure a user record exists (skeleton is fine)
	let user = await prisma.user.findUnique({ where: { email } })
	if (!user) user = await prisma.user.create({ data: { email } })

	const exp = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
	const token = createOrgInviteToken({ orgId: org.id, email, exp })
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
	const acceptUrl = `${appUrl}/?invite=${encodeURIComponent(token)}`

	return NextResponse.json({ ok: true, token, acceptUrl })
}



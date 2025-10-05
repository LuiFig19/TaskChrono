import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyOrgInviteToken } from '@/lib/invites'
import { broadcastActivity } from '@/lib/activity'

export async function GET(req: Request) {
	const url = new URL(req.url)
	const token = url.searchParams.get('token') || ''
	const payload = verifyOrgInviteToken(token)
	if (!payload) return NextResponse.json({ ok: false, reason: 'invalid_or_expired' }, { status: 400 })
	const session = await getServerSession(authOptions)
	// If not signed in, instruct client to show signup popup
	if (!session?.user) {
		return NextResponse.json({ ok: true, needsAuth: true, orgId: payload.orgId, email: payload.email })
	}
	const userId = (session.user as any).id as string
	// Create membership if missing, do not delete other memberships
	try {
		await prisma.organizationMember.create({ data: { organizationId: payload.orgId, userId, role: 'MEMBER' as any } })
	} catch {}

	// Set this org as active for the user so they land in the right workspace
	try {
		const pref = await prisma.userPreference.findUnique({ where: { userId } })
		let state: any = pref?.dashboardWidgets
		if (!state || Array.isArray(state)) state = { orgs: {} }
		state.activeOrgId = payload.orgId
		await prisma.userPreference.upsert({ where: { userId }, update: { dashboardWidgets: state as any }, create: { userId, dashboardWidgets: state as any } })
	} catch {}

	// Broadcast activity for dashboards listening globally
	try {
		const user = await prisma.user.findUnique({ where: { id: userId } })
		broadcastActivity({ type: 'org.member.joined', message: `${user?.name || user?.email || 'A user'} has joined this dashboard 🎉` })
	} catch {}
	return NextResponse.json({ ok: true, needsAuth: false, orgId: payload.orgId })
}



import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string

  const body = await request.json().catch(() => ({})) as { organizationId?: string }
  const organizationId = String(body.organizationId || '')
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

  // Verify user belongs to this org
  const membership = await prisma.organizationMember.findFirst({ where: { userId, organizationId } })
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Store active org in user preferences dashboardWidgets.orgs
  const pref = await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: { userId, dashboardWidgets: {} },
  })

  let state: any = {}
  try { if (pref.dashboardWidgets && typeof pref.dashboardWidgets === 'object') state = pref.dashboardWidgets } catch {}
  state.activeOrgId = organizationId
  await prisma.userPreference.update({ where: { userId }, data: { dashboardWidgets: state } })

  return NextResponse.json({ ok: true })
}
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
	const session = await getServerSession(authOptions)
	if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
	const userId = (session.user as any).id as string
	const body = await request.json().catch(() => ({})) as { organizationId?: string }
	const organizationId = String(body.organizationId || '')
	if (!organizationId) return NextResponse.json({ ok: false }, { status: 400 })
	// Ensure user is a member of this org
	const member = await prisma.organizationMember.findFirst({ where: { userId, organizationId } })
	if (!member) return NextResponse.json({ ok: false }, { status: 403 })
	const pref = await prisma.userPreference.findUnique({ where: { userId } })
	let state: any = pref?.dashboardWidgets
	if (!state || Array.isArray(state)) state = { orgs: {} }
	state.activeOrgId = organizationId
	await prisma.userPreference.upsert({ where: { userId }, update: { dashboardWidgets: state as any }, create: { userId, dashboardWidgets: state as any } })
	return NextResponse.json({ ok: true })
}




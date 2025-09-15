export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseDashboard(url: URL): string {
	const k = url.searchParams.get('dashboard') || 'main'
	return k.trim() || 'main'
}

export async function GET(req: Request) {
	const url = new URL(req.url)
	const dashboard = parseDashboard(url)
	const session = await getServerSession(authOptions)
	if (!session?.user) return NextResponse.json({ layout: null, dashboard }, { status: 200 })
	const userId = (session.user as any).id as string
	const row = await prisma.widgetLayout.findUnique({ where: { userId_dashboard: { userId, dashboard } } })
	return NextResponse.json({ layout: (row?.layout as any) ?? null, dashboard }, { status: 200 })
}

export async function PUT(req: Request) {
	const url = new URL(req.url)
	const dashboard = parseDashboard(url)
	const session = await getServerSession(authOptions)
	if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
	const userId = (session.user as any).id as string
	const body = await req.json().catch(() => ({})) as { layout?: any[] }
	if (!Array.isArray(body.layout)) return NextResponse.json({ ok: false }, { status: 400 })
	await prisma.widgetLayout.upsert({
		where: { userId_dashboard: { userId, dashboard } },
		update: { layout: body.layout as any },
		create: { userId, dashboard, layout: body.layout as any },
	})
	return NextResponse.json({ ok: true }, { status: 200 })
}

export async function DELETE(req: Request) {
	const url = new URL(req.url)
	const dashboard = parseDashboard(url)
	const session = await getServerSession(authOptions)
	if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
	const userId = (session.user as any).id as string
	await prisma.widgetLayout.delete({ where: { userId_dashboard: { userId, dashboard } } }).catch(() => null)
	return NextResponse.json({ ok: true }, { status: 200 })
}

import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
  const userId = user.id as string

  const body = await request.json().catch(() => ({})) as { organizationId?: string }
  const organizationId = String(body.organizationId || '')
  if (!organizationId) return NextResponse.json({ ok: false, error: 'organizationId required' }, { status: 400 })

  // Ensure the user belongs to this organization
  const member = await prisma.organizationMember.findFirst({ where: { userId, organizationId } })
  if (!member) return NextResponse.json({ ok: false }, { status: 403 })

  // Read existing dashboardWidgets safely
  const pref = await prisma.userPreference.findUnique({ where: { userId } })
  let state: any = {}
  try {
    if (pref?.dashboardWidgets && typeof pref.dashboardWidgets === 'object' && !Array.isArray(pref.dashboardWidgets)) {
      state = pref.dashboardWidgets
    }
  } catch {}
  state.activeOrgId = organizationId

  // Upsert preferences with new active org
  await prisma.userPreference.upsert({
    where: { userId },
    update: { dashboardWidgets: state as any },
    create: { userId, dashboardWidgets: state as any },
  })

  return NextResponse.json({ ok: true })
}
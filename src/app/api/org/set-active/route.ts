import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { ApiErrors } from '@/lib/api-response'

export async function POST(request: Request) {
  const { error, userId } = await requireApiAuth()
  if (error) return error

  const body = await request.json().catch(() => ({})) as { organizationId?: string }
  const organizationId = String(body.organizationId || '')
  if (!organizationId) return ApiErrors.missing('organizationId')

  // Ensure the user belongs to this organization
  const member = await prisma.organizationMember.findFirst({ where: { userId, organizationId } })
  if (!member) return ApiErrors.forbidden()

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
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function getCurrentUserAndOrg() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { userId: null, organizationId: null }
  const userId = session.user.id
  // Prefer user's active org from preferences; fall back to first membership
  const [pref, membership] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId } }),
    prisma.organizationMember.findFirst({ where: { userId } }),
  ])
  try {
    const state = pref?.dashboardWidgets as any
    const active = state?.activeOrgId as string | undefined
    if (active) return { userId, organizationId: active }
  } catch {}
  return { userId, organizationId: membership?.organizationId ?? null }
}

export type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

export async function getUserPlanServer(): Promise<Plan> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return 'FREE'
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  })
  return (membership?.organization?.planTier as Plan) ?? 'FREE'
}

// Ensures the current user has an organization; creates a personal one if missing
export async function ensureUserOrg(): Promise<{ organizationId: string | null }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { organizationId: null }
  const userId = session.user.id
  const membership = await prisma.organizationMember.findFirst({ where: { userId } })
  if (membership?.organizationId) return { organizationId: membership.organizationId }
  const org = await prisma.organization.create({ data: { name: 'Personal Workspace', createdById: userId } })
  await prisma.organizationMember.create({ data: { organizationId: org.id, userId, role: 'OWNER' } })
  return { organizationId: org.id }
}



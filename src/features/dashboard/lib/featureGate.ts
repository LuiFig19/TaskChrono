import { headers } from 'next/headers';

import { auth } from '@/lib/better-auth';
import { prisma } from '@/lib/prisma';
/**
 * Feature gate helpers
 * Determine user plan and which features are enabled for the current workspace.
 */

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM';

export async function getUserPlan(): Promise<Plan> {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // If auth throws (e.g., misconfigured baseURL during dev), default to FREE
    return 'FREE';
  }

  if (!session?.user) return 'FREE';

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });
    return (membership?.organization.planTier as Plan) ?? 'FREE';
  } catch {
    return 'FREE';
  }
}

export function isFeatureEnabled(
  plan: Plan,
  feature: 'INVENTORY' | 'INVOICING' | 'ADV_ANALYTICS' | 'FILES' | 'CALENDAR' | 'AI' | 'SCHEDULER',
): boolean {
  switch (feature) {
    case 'ADV_ANALYTICS':
    case 'AI':
    case 'SCHEDULER':
      return plan === 'BUSINESS' || plan === 'ENTERPRISE' || plan === 'CUSTOM';
    case 'FILES':
    case 'CALENDAR':
      return plan === 'FREE' || plan === 'BUSINESS' || plan === 'ENTERPRISE' || plan === 'CUSTOM';
    case 'INVENTORY':
    case 'INVOICING':
      return plan === 'ENTERPRISE' || plan === 'CUSTOM';
    default:
      return false;
  }
}

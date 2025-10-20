import { redirect } from 'next/navigation'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import SettingsClient from './settingsClient'

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  })
  const isAdmin = membership?.role === 'OWNER' || membership?.role === 'ADMIN'
  const organizationId = membership?.organizationId ?? null
  return (
    <SettingsClient isAdmin={!!isAdmin} organizationId={organizationId} plan={membership?.organization?.planTier || 'FREE'} />
  )
}



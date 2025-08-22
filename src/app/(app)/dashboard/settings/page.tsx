import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SettingsClient from './settingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: (session.user as unknown as { id: string }).id },
    include: { organization: true },
  })
  const isAdmin = membership?.role === 'OWNER' || membership?.role === 'ADMIN'
  const organizationId = membership?.organizationId ?? null
  return (
    <SettingsClient isAdmin={!!isAdmin} organizationId={organizationId} plan={membership?.organization?.planTier || 'FREE'} />
  )
}



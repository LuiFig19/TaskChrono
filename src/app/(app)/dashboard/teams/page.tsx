import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import TeamsClient from './teamsClient'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) redirect('/login')

  const docs = await prisma.teamDoc.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold">Teams</h1>
      <TeamsClient initialDocs={docs as any} />
    </div>
  )
}



import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TeamsClient from './teamsClient'

export default async function TeamDetailPage({ params, searchParams }: { params: { teamId: string }, searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const tab = (searchParams?.tab || 'overview') as string
  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-6 pb-6">
      <TeamsClient teamId={params.teamId} initialTab={tab} />
    </div>
  )
}



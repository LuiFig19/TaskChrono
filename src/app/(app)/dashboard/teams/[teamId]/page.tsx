import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TeamsClient from './teamsClient'

export default async function TeamDetailPage(context: { params: Promise<{ teamId: string }>, searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const { teamId } = await context.params
  const s = await context.searchParams
  const tab = (s?.tab || 'overview') as string
  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8 pt-6 pb-8">
      <TeamsClient teamId={teamId} initialTab={tab} />
    </div>
  )
}



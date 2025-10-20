import { redirect } from 'next/navigation'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'

export default async function AIAdvisorPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }
  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold">AI Productivity Advisor</h1>
      <p className="text-gray-600 mt-2">Suggested priorities and optimal work schedules will appear here.</p>
      <div className="mt-6 border rounded-lg p-4 text-sm text-gray-600">
        Coming soon: AI-driven task prioritization and scheduling.
      </div>
    </div>
  )
}



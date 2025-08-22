import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function AIAdvisorPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">AI Productivity Advisor</h1>
      <p className="text-gray-600 mt-2">Suggested priorities and optimal work schedules will appear here.</p>
      <div className="mt-6 border rounded-lg p-4 text-sm text-gray-600">
        Coming soon: AI-driven task prioritization and scheduling.
      </div>
    </div>
  )
}



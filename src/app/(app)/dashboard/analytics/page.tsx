import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'
import Chart from '../_components/Chart'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  const plan = await getUserPlanServer()
  if (plan === 'FREE') return <LockedFeature title="Analytics" />
  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-0 pb-6 -mt-10 md:-mt-14 -translate-y-10 md:-translate-y-14">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Time by Week</div>
          <div className="mt-4 rounded bg-slate-800">
            <Chart demo />
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Top Projects</div>
          <div className="mt-4 rounded bg-slate-800">
            <Chart demo />
          </div>
        </div>
      </div>
    </div>
  )
}



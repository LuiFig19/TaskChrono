import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardGrid from './_components/DashboardGrid'
import BillingGuard from './_components/BillingGuard'
import AddWidgetMenu from './_components/AddWidgetMenu'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  // Fetch user's first organization and its plan tier
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: (session.user as unknown as { id: string }).id },
    include: { organization: true },
  })
  if (!membership?.organization) {
    // If the membership or org is missing (race condition after signup), send to onboarding
    redirect('/get-started')
  }
  const plan = membership.organization.planTier
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Billing guard blocks dashboard usage beyond 14-day trial until subscription */}
      <BillingGuard />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <AddWidgetMenu plan={plan as any} />

        <form action="/api/timers/start" method="post">
          <button className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Start Timer</button>
        </form>
        <a href="/dashboard/files" className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Upload File</a>
        <details className="relative ml-auto">
          <summary className="list-none cursor-pointer px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-1">
            <span>ℹ️</span>
            <span className="text-sm">Info</span>
          </summary>
          <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm text-slate-200">
            <div className="animate-[fadein_200ms_ease-out]">
              <div className="font-medium text-white mb-1">Customizable Dashboard</div>
              <p className="text-slate-300">All cards are draggable and reorderable. Add or remove widgets anytime to tailor your workspace.</p>
              <ul className="mt-2 list-disc pl-5 text-slate-300">
                <li>Drag by the card to move.</li>
                <li>Use the trash icon to remove.</li>
                <li>Use “Add Task” to add more widgets.</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
      <DashboardGrid plan={plan as any} />
    </div>
  )
}



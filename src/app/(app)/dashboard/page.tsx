import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardGrid from './_components/DashboardGrid'
import BillingGuard from './_components/BillingGuard'
import RadialActions from './_components/RadialActions'
import ResetLayoutButton from './_components/ResetLayoutButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  // Fetch user's first organization and its plan tier
  let membership: any = null
  try {
    membership = await prisma.organizationMember.findFirst({
      where: { userId: (session.user as unknown as { id: string }).id },
      include: { organization: true },
    })
  } catch {}
  if (!membership?.organization) {
    // Try to provision in the background; do not block rendering
    const userId = (session.user as any)?.id as string | undefined
    const userName = (session.user as any)?.name as string | undefined
    const workspaceName = userName ? `${userName.split(' ')[0]}'s Workspace` : 'My Workspace'
    if (userId) {
      ;(async () => {
        try {
          const org = await prisma.organization.create({
            data: { name: workspaceName, planTier: 'FREE' as any, createdById: userId, trialEndsAt: new Date(Date.now() + 14*24*60*60*1000) },
          })
          await prisma.organizationMember.upsert({
            where: { organizationId_userId: { organizationId: org.id, userId } },
            create: { organizationId: org.id, userId, role: 'OWNER' as any },
            update: { role: 'OWNER' as any },
          })
        } catch {}
      })()
    }
  }
  const plan = (membership?.organization?.planTier as any) ?? 'FREE'
  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-6 pb-6">
      {/* Billing guard blocks dashboard usage beyond 14-day trial until subscription */}
      <BillingGuard />

      {/* Actions row: left actions, right info */}
      <div className="mb-4 flex items-center gap-2">
        <RadialActions plan={plan as any} />
        <div className="ml-auto relative z-[100000] flex items-center gap-2">
          <details className="relative">
            <summary className="list-none cursor-pointer px-3 py-1.5 rounded-full border border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-colors">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-xs">i</span>
              <span className="text-sm">Info</span>
            </summary>
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/75 shadow-2xl p-3 text-sm text-slate-200 z-[100000] animate-[fadein_160ms_ease-out]">
              <div>
                <div className="font-medium text-white mb-1">Customizable Dashboard</div>
                <p className="text-slate-300">All cards are draggable and reorderable. Add or remove widgets anytime to tailor your workspace.</p>
                <ul className="mt-2 list-disc pl-5 text-slate-300">
                  <li>Drag by the card to move.</li>
                  <li>Use the trash icon to remove.</li>
                  <li>Use the Actions menu to add widgets or quick actions.</li>
                </ul>
              </div>
            </div>
          </details>
          <ResetLayoutButton />
        </div>
      </div>

      <DashboardGrid plan={plan as any} />
    </div>
  )
}



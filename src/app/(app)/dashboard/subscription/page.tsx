import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function SubscriptionPage({ searchParams }: { searchParams?: { upgrade?: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) redirect('/login?callbackUrl=/dashboard/subscription')
  const userId = session.user.id
  const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
  const plan = membership?.organization?.planTier || 'FREE'

  async function openCheckout(tier: 'BUSINESS'|'ENTERPRISE') {
    'use server'
    // server action to create a checkout and redirect
    return tier
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 pt-2 pb-6">
      <h1 className="text-2xl font-semibold">Subscription</h1>
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="text-sm text-slate-300">Current plan</div>
        <div className="text-lg font-medium mt-0.5">{plan}</div>
      </div>

      <div className="mt-6 grid gap-4">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="font-medium">Benefits</div>
          <ul className="mt-2 list-disc pl-5 text-slate-300 text-sm">
            {plan === 'FREE' ? (
              <>
                <li>Track time, tasks, and 1 active project</li>
                <li>3 users included</li>
                <li>CSV/PDF exports</li>
              </>
            ) : (
              <>
                <li>Unlimited projects, tasks, and teams</li>
                <li>Advanced analytics & performance insights</li>
                <li>Calendar sync, file storage and more</li>
              </>
            )}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="font-medium">Limits / Locked tools</div>
          <ul className="mt-2 list-disc pl-5 text-slate-300 text-sm">
            {plan === 'FREE' ? (
              <>
                <li>Some analytics widgets locked</li>
                <li>Inventory tracking unavailable</li>
                <li>No team roles/permissions</li>
              </>
            ) : (
              <li>No limits on core features</li>
            )}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="font-medium">Upgrade</div>
          <div className="mt-2 flex gap-2">
            <form action="/api/billing/checkout" method="post">
              <input type="hidden" name="tier" value="BUSINESS" />
              <input type="hidden" name="seats" value="1" />
              <button className="px-3 py-2 rounded border border-indigo-600 text-indigo-300 hover:bg-slate-800">Upgrade to Business</button>
            </form>
            <form action="/api/billing/checkout" method="post">
              <input type="hidden" name="tier" value="ENTERPRISE" />
              <input type="hidden" name="seats" value="1" />
              <button className="px-3 py-2 rounded border border-indigo-600 text-indigo-300 hover:bg-slate-800">Upgrade to Enterprise</button>
            </form>
          </div>
          <div className="text-xs text-slate-400 mt-2">You will be redirected to Stripe Checkout to complete your upgrade.</div>
        </section>
      </div>
    </div>
  )
}



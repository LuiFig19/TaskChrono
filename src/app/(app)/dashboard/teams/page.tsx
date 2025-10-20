import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function TeamsIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  // Load the user's teams server-side so the list is present on first paint
  const userId = session.user.id
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { joinedAt: 'desc' },
  })
  const teams = memberships.map((m) => ({ id: m.team.id, name: m.team.name }))

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8 pt-6 pb-8" data-teams-layout>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4 h-[70vh] md:sticky md:top-[calc(var(--nav-h,56px)+16px)]">
          <div className="flex items-center gap-2 mb-3">
            <input placeholder="Search teams" className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 text-sm" />
            <a href="/dashboard/teams/new" className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+ New</a>
          </div>
          <div className="text-xs text-slate-400 mb-2">Teams</div>
          <div className="space-y-1 overflow-y-auto pr-1">
            {teams.length === 0 ? (
              <a href="/dashboard/teams/new" className="block px-3 py-2 rounded border border-slate-800 hover:bg-slate-800/60">Create your first team</a>
            ) : (
              teams.map((t) => (
                <Link key={t.id} href={`/dashboard/teams/${t.id}?tab=overview`} className="block px-3 py-2 rounded hover:bg-slate-800/60 border border-slate-800/0 hover:border-slate-800">
                  {t.name}
                </Link>
              ))
            )}
          </div>
        </aside>
        <main className="rounded-xl border border-slate-800 bg-slate-900 p-4 pt-12 md:pt-12 lg:pt-14">
          <div className="ml-1 md:ml-2 space-y-1">
            <h1 className="text-2xl font-semibold relative top-0.5">Teams</h1>
            <p className="text-slate-300">Select a team on the left or create a new one.</p>
          </div>
        </main>
      </div>
    </div>
  )
}

 

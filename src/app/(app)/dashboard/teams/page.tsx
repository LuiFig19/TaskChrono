import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TeamsIndexPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-8 pt-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4 h-[70vh] md:sticky md:top-[calc(var(--nav-h,56px)+16px)]">
          <div className="flex items-center gap-2 mb-3">
            <input placeholder="Search teams" className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 text-sm" />
            <a href="/dashboard/teams/new" className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+ New</a>
          </div>
          <div className="text-xs text-slate-400 mb-2">Teams</div>
          <div className="space-y-1 overflow-y-auto pr-1">
            <a href="/dashboard/teams/new" className="block px-3 py-2 rounded border border-slate-800 hover:bg-slate-800/60">Create your first team</a>
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

 

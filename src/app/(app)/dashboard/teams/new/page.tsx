import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewTeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return (
    <div className="max-w-screen-sm mx-auto px-4 pt-6 pb-6">
      <h1 className="text-2xl font-semibold">Create Team</h1>
      <form action="/api/teams" method="post" className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-slate-300">Name</span>
          <input name="name" required className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-300">Description</span>
          <textarea name="description" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100" />
        </label>
        <button formAction={async (formData)=>{
          'use server'
        }} className="hidden" />
        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 w-max">Create</button>
      </form>
    </div>
  )
}



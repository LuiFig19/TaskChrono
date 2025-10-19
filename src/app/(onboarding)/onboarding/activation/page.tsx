import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import Link from 'next/link'
import { finalizeOrganizationAction } from '../actions'

export default async function ActivationPage({ searchParams }: { searchParams?: { plan?: string } }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    redirect('/login')
  }
  const plan = searchParams?.plan || 'FREE'
  return (
    <div className="max-w-screen-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold">Plan activation</h1>
      <p className="text-gray-600 mt-1">Your 14-day free trial starts now for the {plan} plan.</p>
      <form action={finalizeOrganizationAction} className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Company name</span>
          <input name="name" placeholder="Acme Inc" className="px-3 py-2 rounded-md border" />
        </label>
        <button className="px-4 py-2 rounded-md bg-black text-white">Continue to Dashboard</button>
      </form>
    </div>
  )
}



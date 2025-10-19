import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import Link from 'next/link'
import { createOrganizationAction } from './actions'

export default async function OnboardingPage(
  props: { searchParams?: { plan?: string } } | { searchParams: Promise<{ plan?: string }> }
) {
  let planParam: string | undefined
  try {
    const maybe = (props as any).searchParams
    const sp = typeof maybe?.then === 'function' ? await maybe : (maybe || {})
    planParam = sp?.plan
  } catch {}
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    const plan = planParam || 'FREE'
    const cb = encodeURIComponent(`/onboarding?plan=${plan}`)
    redirect(`/register?callbackUrl=${cb}`)
  }
  const plan = planParam || 'FREE'
  const planLabel = (() => {
    const upper = String(plan).toUpperCase()
    if (upper === 'FREE') {
      return <span className="font-semibold text-green-400">FREE</span>
    }
    if (upper === 'BUSINESS') {
      return <span className="font-semibold text-orange-400">💼 BUSINESS</span>
    }
    if (upper === 'ENTERPRISE') {
      return (
        <span className="font-semibold text-amber-400">
          <span className="not-italic mr-1">🏢</span>
          <span className="italic">ENTERPRISE</span>
        </span>
      )
    }
    return <span className="font-semibold text-indigo-300">✨ {upper}</span>
  })()
  return (
    <div className="relative overflow-hidden min-h-[100vh] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 opacity-40 animate-pulse bg-[radial-gradient(ellipse_60%_60%_at_20%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(ellipse_50%_50%_at_80%_30%,rgba(37,99,235,0.25),transparent_60%)]" />
      {/* Centered modal */}
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur shadow-2xl">
          <div className="mb-2">
            <span className="tc-animated-gradient text-lg font-extrabold">TaskChrono</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your workspace</h1>
          <p className="text-slate-300 mt-1">Selected plan: {planLabel}</p>

          <form className="mt-6 grid gap-5" action={createOrganizationAction}>
          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Organization name</span>
            <input className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" name="name" placeholder="Acme Inc" required />
          </label>

          <div className="grid gap-1">
            <span className="text-sm text-slate-300">Invite teammates (optional)</span>
            <input className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-3 py-2" name="emails" placeholder="name1@company.com, name2@company.com" />
            <span className="text-xs text-slate-400">We’ll send email invites after setup. You can manage roles in Settings.</span>
          </div>

          <input type="hidden" name="plan" value={plan} />

            <div className="flex items-center gap-3">
              <button type="submit" className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Continue</button>
              <Link href="/get-started" className="text-slate-300 hover:text-white transition-colors">Choose a different plan</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



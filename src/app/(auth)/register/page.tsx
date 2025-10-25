import { signOutAction } from './actions'
import Link from 'next/link'
import { auth } from '@/lib/better-auth'
import { headers, cookies } from 'next/headers'
import RegisterForm from './RegisterForm'

export default async function RegisterPage(
  props:
    | { searchParams?: { callbackUrl?: string; plan?: string } }
    | { searchParams: Promise<{ callbackUrl?: string; plan?: string }> }
) {
  let params: { callbackUrl?: string; plan?: string } = {}
  try {
    const maybe = (props as any).searchParams
    params = typeof maybe?.then === 'function' ? await maybe : maybe || {}
  } catch {}
  
  const plan = params.plan || 'FREE'
  const dst =
    typeof params.callbackUrl === 'string' && params.callbackUrl
      ? params.callbackUrl
      : `/onboarding?plan=${plan}`

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  // Never allow a signed-in state on the signup page: auto sign-out silently
  if (session?.user) {
    try { await auth.api.signOut({ headers: await headers(), cookies: await cookies() }) } catch {}
  }

  return (
    <div className="relative overflow-hidden min-h-[100vh] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 opacity-40 animate-pulse bg-[radial-gradient(ellipse_60%_60%_at_20%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(ellipse_50%_50%_at_80%_30%,rgba(37,99,235,0.25),transparent_60%)]" />
      
      {/* Centered card */}
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur shadow-2xl">
          <div className="mb-3">
            <span className="tc-animated-gradient text-2xl font-extrabold">TaskChrono</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-300 mt-2">
            {plan === 'FREE' && 'Sign up to get started with TaskChrono'}
            {plan === 'BUSINESS' && '14-day free trial • $5/user/month after trial'}
            {plan === 'ENTERPRISE' && '14-day free trial • $12/user/month after trial'}
            {plan === 'CUSTOM' && 'Contact us for custom pricing'}
          </p>
          
          {/* Auto signed-out above; no banner shown on signup */}
          
          <RegisterForm callbackUrl={dst} />
          
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link 
              href={`/login?callbackUrl=${encodeURIComponent(dst)}`} 
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

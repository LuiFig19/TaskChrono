import { registerLocalAction } from './actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'

export default async function RegisterPage(
  props:
    | { searchParams?: { callbackUrl?: string } }
    | { searchParams: Promise<{ callbackUrl?: string }> }
) {
  let params: { callbackUrl?: string } = {}
  try {
    const maybe = (props as any).searchParams
    params = typeof maybe?.then === 'function' ? await maybe : maybe || {}
  } catch {}
  const dst =
    typeof params.callbackUrl === 'string' && params.callbackUrl
      ? params.callbackUrl
      : '/dashboard'

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user) redirect(dst)

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
          <p className="text-slate-300 mt-2">Sign up to get started with TaskChrono</p>
          
          <form action={registerLocalAction} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Name (optional)</span>
              <input 
                name="name" 
                type="text" 
                placeholder="John Doe" 
                className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </label>
            
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Email</span>
              <input 
                name="email" 
                type="email" 
                placeholder="you@company.com" 
                required 
                className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </label>
            
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Password</span>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
            </label>
            
            <input name="callbackUrl" type="hidden" value={dst} />
            
            <button className="mt-2 w-full px-5 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
              Create account
            </button>
          </form>
          
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

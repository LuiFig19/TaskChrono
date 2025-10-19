import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'

export default async function ActivationPage(
  props: { searchParams?: { plan?: string } } | { searchParams: Promise<{ plan?: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login')
  }

  redirect('/dashboard')
}

const OldActivationPageContent = () => (
    <div className="relative overflow-hidden min-h-[100vh] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-40 animate-pulse bg-[radial-gradient(ellipse_60%_60%_at_20%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(ellipse_50%_50%_at_80%_30%,rgba(37,99,235,0.25),transparent_60%)]" />
      
      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur shadow-2xl text-center">
          <div className="mb-4 inline-flex rounded-full bg-green-500/10 p-4">
            <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-slate-300 text-lg mb-6">
            Your 14-day free trial has started. You won't be charged until the trial ends.
          </p>
          
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 mb-8">
            <div className="text-sm text-slate-400 mb-2">Selected Plan</div>
            <div className="text-2xl font-semibold text-indigo-300">
              {plan === 'BUSINESS' ? '💼 Business' : '🏢 Enterprise'}
            </div>
            <div className="text-slate-300 mt-2">
              {plan === 'BUSINESS' ? '$5/user/month after trial' : '$12/user/month after trial'}
            </div>
          </div>

          <div className="space-y-3 text-left mb-8">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-medium text-white">Trial period active</div>
                <div className="text-sm text-slate-400">Enjoy full access for 14 days, no payment required</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-medium text-white">Cancel anytime</div>
                <div className="text-sm text-slate-400">No commitment - cancel before trial ends if you change your mind</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-medium text-white">Full feature access</div>
                <div className="text-sm text-slate-400">All {plan.toLowerCase()} features unlocked immediately</div>
              </div>
            </div>
          </div>
          
          <Link 
            href="/dashboard" 
            className="inline-flex px-6 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}



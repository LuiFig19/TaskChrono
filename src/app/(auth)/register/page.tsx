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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-gray-600 mt-1">Sign up to get started with TaskChrono</p>
        <form action={registerLocalAction} className="grid gap-2 mt-4">
          <input name="name" type="text" placeholder="Name (optional)" className="w-full px-3 py-2 rounded-md border" />
          <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 rounded-md border" />
          <input name="password" type="password" placeholder="Password" required className="w-full px-3 py-2 rounded-md border" />
          <input name="callbackUrl" type="hidden" value={dst} />
          <button className="w-full px-4 py-2 rounded-md border">Create account</button>
        </form>
        <div className="mt-6 text-xs text-gray-500">
          Already have an account?{' '}
          <Link href={`/login?callbackUrl=${encodeURIComponent(dst)}`} className="underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

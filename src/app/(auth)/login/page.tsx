import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage(props: { searchParams?: { callbackUrl?: string } } | { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await getServerSession(authOptions)
  let params: { callbackUrl?: string } = {}
  try {
    const maybe = (props as any).searchParams
    params = typeof maybe?.then === 'function' ? await maybe : (maybe || {})
  } catch {}
  const dst = typeof params.callbackUrl === 'string' && params.callbackUrl ? params.callbackUrl : '/dashboard'
  const callbackUrl = encodeURIComponent(dst)
  redirect(`/?signin=1&dst=${callbackUrl}`)
}



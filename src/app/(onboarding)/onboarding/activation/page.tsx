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

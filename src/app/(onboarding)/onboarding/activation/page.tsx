import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function ActivationPage(
  props: { searchParams?: { plan?: string } } | { searchParams: Promise<{ plan?: string }> }
) {
  // Ensure session is fresh after Stripe redirect
  const session = await auth.api.getSession({
    headers: await headers(),
    cookies: await cookies(),
  })

  if (!session?.user) {
    redirect('/login')
  }

  // Check if user has an organization (with retry for DB propagation delay)
  let membership: any = null
  let attempts = 0
  while (!membership && attempts < 3) {
    try {
      membership = await prisma.organizationMember.findFirst({
        where: { userId: session.user.id },
        include: { organization: true },
      })
      if (membership) break
      // Wait 500ms before retry
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    } catch {
      break
    }
  }

  // If still no org after retries, go to dashboard anyway (it will redirect to onboarding if needed)
  redirect('/dashboard')
}

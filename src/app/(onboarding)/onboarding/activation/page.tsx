import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function ActivationPage({ searchParams }: { searchParams?: { plan?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  const plan = searchParams?.plan || 'FREE'
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold">Plan activation</h1>
      <p className="text-gray-600 mt-1">Your 14-day free trial starts now for the {plan} plan.</p>
      <div className="mt-6">
        <Link href="/dashboard" className="px-4 py-2 rounded-md bg-black text-white">Continue to Dashboard</Link>
      </div>
    </div>
  )
}



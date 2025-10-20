import { redirect } from 'next/navigation'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import InventoryClient from './ui/InventoryClient'
import { getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'

export default async function InventoryPage() {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) {
                redirect('/login')
        }
  const plan = await getUserPlanServer()
  if (plan === 'FREE') return <LockedFeature title="Inventory Tracking" />
        return (
                <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-6">
                        <InventoryClient />
                </div>
        )
}


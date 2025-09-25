import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import InventoryClient from './ui/InventoryClient'
import { getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'

export default async function InventoryPage() {
	const session = await getServerSession(authOptions)
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


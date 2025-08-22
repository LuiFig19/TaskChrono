import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import InventoryClient from './ui/InventoryClient'

export default async function InventoryPage() {
	const session = await getServerSession(authOptions)
	if (!session?.user) {
		redirect('/login')
	}
	return (
		<div className="max-w-7xl mx-auto px-4 py-6">
			<InventoryClient />
		</div>
	)
}


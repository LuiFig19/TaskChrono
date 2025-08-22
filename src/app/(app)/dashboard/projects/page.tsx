import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ProjectsClient from './projectsClient'

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <ProjectsClient />
    </div>
  )
}



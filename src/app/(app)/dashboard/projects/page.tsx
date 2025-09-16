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
    <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-6">
      <ProjectsClient />
    </div>
  )
}



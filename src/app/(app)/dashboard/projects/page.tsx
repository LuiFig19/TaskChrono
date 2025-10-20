import { redirect } from 'next/navigation'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import ProjectsClient from './projectsClient'

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }
  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-6">
      <ProjectsClient />
    </div>
  )
}



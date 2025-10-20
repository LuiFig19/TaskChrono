import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import BoardClient from './boardClient'
import { prisma } from '@/lib/prisma'

export default async function ProjectBoardPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')
  // fetch basic project info for header
  const project = await prisma.project.findUnique({ where: { id: params.id } })
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {project && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
          {project.description && <p className="text-slate-400 mt-1">{project.description}</p>}
        </div>
      )}
      <BoardClient projectId={params.id} />
    </div>
  )
}



import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentUserAndOrg, getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'
import { prisma } from '@/lib/prisma'
import { createFileRecord, deleteFileRecord } from './actions'

export default async function FilesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const plan = await getUserPlanServer()
  const { organizationId } = await getCurrentUserAndOrg()
  const files = organizationId ? await prisma.fileRecord.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } }) : []
  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-0 pb-6 -mt-10 md:-mt-14 -translate-y-10 md:-translate-y-14">
      <h1 className="text-2xl font-semibold">Saved Files</h1>
      <form action={createFileRecord} className="mt-4 flex gap-2">
        <input name="name" placeholder="File name" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
        <input name="url" placeholder="Link (optional)" className="w-80 px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
        <button className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Add</button>
      </form>
      <div className="mt-4">
        <form action="/api/upload" method="post" encType="multipart/form-data" className="flex items-center gap-2">
          <label htmlFor="fileInput" className="sr-only">Choose file</label>
          <input id="fileInput" type="file" name="file" className="text-sm" title="Choose file to upload" />
          <button className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-200" formAction="/api/upload">Upload to /public/uploads</button>
        </form>
        <div className="text-xs text-slate-500 mt-1">Note: Uploads are saved locally to /public/uploads when available.</div>
      </div>
      <div className="mt-6">
        {files.length === 0 ? (
          <div className="text-slate-400">No files yet.</div>
        ) : (
          <ul className="grid gap-2">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                <div>
                  <div className="text-white">{f.name}</div>
                  <div className="text-xs text-slate-400">{f.url || '—'}</div>
                </div>
                <form action={deleteFileRecord}>
                  <input type="hidden" name="id" value={f.id} />
                  <button className="text-sm text-slate-300 hover:text-white">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}



import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function CompanyPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id as string
  const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
  if (!membership?.organization) redirect('/get-started')
  const org = membership.organization
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Company</h1>
      <form action="/api/company/update" method="post" className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={org.id} />
        <label className="grid gap-1">
          <span className="text-sm text-slate-300">Company Name</span>
          <input name="name" defaultValue={org.name} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
        </label>
        <button className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 w-max">Save</button>
      </form>
    </div>
  )
}



import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  if (session?.user) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Create your TaskChrono account</h1>
        <p className="text-sm text-gray-600 mt-1">Register with Google</p>
        <div className="mt-6">
          <Link href="/login" className="px-4 py-2 rounded-md bg-black text-white w-full inline-block text-center">Continue with Google</Link>
        </div>
        <form className="mt-6 grid gap-3" action={async (formData) => {
          'use server'
          const email = String(formData.get('email')||'').trim().toLowerCase()
          const password = String(formData.get('password')||'')
          if (!email || !password) return
          const existing = await prisma.user.findUnique({ where: { email } })
          if (existing) return
          const hash = await bcrypt.hash(password, 10)
          await prisma.user.create({ data: { email, passwordHash: hash, role: 'ADMIN' } })
        }}>
          <input name="email" type="email" placeholder="Email" className="border rounded px-3 py-2" required />
          <input name="password" type="password" placeholder="Password" className="border rounded px-3 py-2" required />
          <button className="px-4 py-2 rounded-md border">Create Admin Account</button>
        </form>
      </div>
    </div>
  )
}



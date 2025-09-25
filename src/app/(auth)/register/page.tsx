import { registerLocalAction } from './actions'

export default function RegisterPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Create a local admin</h1>
        <p className="text-sm text-gray-600 mt-1">This will create a credentials user and an Enterprise org in your local DB.</p>
        <form action={registerLocalAction} className="grid gap-2 mt-4">
          <input name="name" type="text" placeholder="Name (optional)" className="w-full px-3 py-2 rounded-md border" />
          <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 rounded-md border" />
          <input name="password" type="password" placeholder="Password" required className="w-full px-3 py-2 rounded-md border" />
          <button className="w-full px-4 py-2 rounded-md border">Create admin</button>
        </form>
      </div>
    </div>
  )
}

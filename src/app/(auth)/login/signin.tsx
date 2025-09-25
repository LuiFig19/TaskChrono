"use client"
import { signIn } from 'next-auth/react'
import React from 'react'

export function SignIn({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl })}
      className="w-full px-4 py-2 rounded-md bg-black text-white"
    >
      Continue with Google
    </button>
  )
}

export function CredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  return (
    <form
      className="grid gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
          const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl,
          })
          if (res?.error) {
            setError('Invalid email or password')
          } else if (res?.url) {
            window.location.href = res.url
          }
        } finally {
          setLoading(false)
        }
      }}
    >
      <input
        type="email"
        placeholder="Email"
        className="w-full px-3 py-2 rounded-md border"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full px-3 py-2 rounded-md border"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        required
      />
      {error ? <div className="text-sm text-rose-500">{error}</div> : null}
      <button disabled={loading} className="w-full px-4 py-2 rounded-md border disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sign in with Credentials'}
      </button>
    </form>
  )
}



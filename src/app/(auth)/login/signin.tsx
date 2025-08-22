'use client'
import { signIn } from 'next-auth/react'

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



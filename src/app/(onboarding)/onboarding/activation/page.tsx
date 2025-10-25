import { Suspense } from 'react'
import ActivationClient from './ActivationClient'

export const dynamic = 'force-dynamic'

export default function ActivationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <h1 className="text-2xl font-semibold text-white mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <ActivationClient />
    </Suspense>
  )
}

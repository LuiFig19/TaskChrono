export default function LockedFeature({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
      <div className="text-2xl mb-2">🔒</div>
      <div className="text-white font-medium">{title} is not available on your plan</div>
      <div className="text-slate-400 text-sm mt-1">Upgrade your subscription to unlock this feature.</div>
      <a href="/dashboard/subscription" className="inline-block mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">View Plans</a>
    </div>
  )
}




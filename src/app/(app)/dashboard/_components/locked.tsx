"use client"
export default function LockedFeature({ title }: { title: string }) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/95" />
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] text-slate-200">
        <button onClick={()=>{ if (typeof window!=='undefined') window.history.back() }} className="absolute right-3 top-3 text-slate-400 hover:text-white" aria-label="Close">✕</button>
        <div className="text-3xl font-bold text-white">Unlock {title}</div>
        <div className="mt-2 text-slate-300">Upgrade to access premium insights, automate workflows, and save hours every week.</div>
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {[
            { h: 'Save 6–12h/week', p: 'Automated analytics and reports reduce manual effort so your team focuses on work that matters.' },
            { h: 'More visibility', p: 'Project and time analytics help you spot blockers earlier and deliver on schedule.' },
            { h: 'Revenue accuracy', p: 'Invoice and budgeting tools ensure you bill correctly and improve margins.' },
            { h: 'Scale with confidence', p: 'Advanced permissions, inventory, and exports ready when your team grows.' },
          ].map((b, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="font-medium text-white">{b.h}</div>
              <div className="text-sm text-slate-300 mt-1">{b.p}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="/dashboard/subscription" className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">See Plans & Upgrade</a>
          <button onClick={()=>{ if (typeof window!=='undefined') window.history.back() }} className="px-5 py-2.5 rounded-md border border-slate-700 hover:bg-slate-800">Back to Dashboard</button>
        </div>
      </div>
    </div>
  )
}




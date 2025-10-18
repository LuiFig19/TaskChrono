"use client"
export default function LockedFeature({ title }: { title: string }) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/95 light:bg-black/30" />
      <div data-locked-modal className="relative mx-4 w-full max-w-2xl rounded-2xl border border-slate-800 light:border-slate-300 bg-gradient-to-b from-slate-950 to-slate-900 light:bg-white light:bg-none p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] light:shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-slate-200 light:text-slate-900">
        <button
          onClick={()=>{ if (typeof window!=='undefined') window.history.back() }}
          className="absolute right-3 top-3 h-8 w-8 grid place-items-center rounded-md bg-transparent border-0 shadow-none"
          aria-label="Close"
          data-locked-close
        >
          <span aria-hidden className="block relative h-3 w-5">
            <span className="absolute left-0 top-0 h-0.5 w-5 translate-y-1.5 rotate-45 dark:bg-slate-200 light:bg-black"></span>
            <span className="absolute left-0 bottom-0 h-0.5 w-5 -translate-y-1.5 -rotate-45 dark:bg-slate-200 light:bg-black"></span>
          </span>
        </button>
        <div className="text-3xl font-bold text-white light:text-slate-900">Unlock {title}</div>
        <div className="mt-2 text-slate-300 light:text-slate-600">Upgrade to access premium insights, automate workflows, and save hours every week.</div>
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {[
            { h: 'Save 6–12h/week', p: 'Automated analytics and reports reduce manual effort so your team focuses on work that matters.' },
            { h: 'More visibility', p: 'Project and time analytics help you spot blockers earlier and deliver on schedule.' },
            { h: 'Revenue accuracy', p: 'Invoice and budgeting tools ensure you bill correctly and improve margins.' },
            { h: 'Scale with confidence', p: 'Advanced permissions, inventory, and exports ready when your team grows.' },
          ].map((b, i) => (
            <div key={i} className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white p-4">
              <div className="font-medium text-white light:text-slate-900">{b.h}</div>
              <div className="text-sm text-slate-300 light:text-slate-600 mt-1">{b.p}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="/dashboard/subscription" className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">See Plans & Upgrade</a>
          <button onClick={()=>{ if (typeof window!=='undefined') window.history.back() }} className="px-5 py-2.5 rounded-md border border-slate-700 hover:bg-slate-800 light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100">Back to Dashboard</button>
        </div>
      </div>
    </div>
  )
}




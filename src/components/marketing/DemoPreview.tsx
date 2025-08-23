export default function DemoPreview() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

  // Light markers so the calendar looks alive without real data
  const markedDays = new Set<number>([8, 30])

  return (
    <div className="space-y-6">
      {/* Top action bar laid out to match screenshot */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button className="px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700">Add Task</button>
        <button className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Start Timer</button>
        <button className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Upload File</button>
        <span className="ml-2 hidden text-xs text-slate-400 sm:inline">Demo Preview: Off</span>
        <details className="relative ml-auto">
          <summary className="list-none cursor-pointer px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-1">
            <span>ℹ️</span>
            <span className="text-sm">Info</span>
          </summary>
          <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm text-slate-200">
            <div className="font-medium text-white mb-1">Customizable Dashboard</div>
            <p className="text-slate-300">All cards are draggable and reorderable. Add or remove widgets anytime to tailor your workspace.</p>
          </div>
        </details>
      </div>

      {/* Main grid mirrors the real dashboard layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <div className="font-medium text-white">Calendar</div>
          <div className="mt-2 text-sm text-slate-400">Quick view of this month. Create detailed events in Calendar.</div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isMarked = markedDays.has(day)
              const href = `/demo-dashboard/calendar?d=${year}-${pad(month + 1)}-${pad(day)}T09:00`
              return (
                <a
                  key={`demo-cal-${day}`}
                  href={href}
                  className={`relative group block py-2 rounded border border-slate-700 ${
                    isMarked ? 'text-white ring-1 bg-indigo-600/20 ring-indigo-500/40' : 'bg-slate-800/60 text-slate-300'
                  } transition-colors`}
                >
                  {day}
                  {isMarked && <span aria-hidden className="pointer-events-none absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />}
                </a>
              )
            })}
          </div>
          <a href={`/demo-dashboard/calendar?d=${year}-${pad(month + 1)}-${pad(1)}T09:00`} className="inline-block mt-3 px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800">Open Calendar</a>
        </div>

        {/* Time Tracking Overview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Time Tracking Overview</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[{ label: 'Today' }, { label: 'This Week' }, { label: 'This Month' }].map((s) => (
              <div key={s.label} className="rounded-md border border-slate-700 p-3">
                <div className="text-xs text-slate-400">{s.label}</div>
                <div className="text-xl font-semibold text-white">0h 0m</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity Feed */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Team Activity Feed</div>
          <div className="mt-4 text-sm text-slate-400">No activity yet. Create a task to get started.</div>
        </div>

        {/* Project Progress – matches screenshot with inline inputs and Save buttons */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <div className="font-medium text-white">Project Progress</div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {['Website Redesign', 'Inventory Module', 'Mobile App'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <input
                  aria-label={label}
                  defaultValue={label}
                  className="flex-1 px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100"
                />
                <button className="px-2 py-1 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Save</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



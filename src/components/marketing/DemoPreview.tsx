export default function DemoPreview() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Time Tracking Overview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="font-medium text-white">Time Tracking Overview</div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Today', value: '6h 12m' },
            { label: 'This Week', value: '32h 45m' },
            { label: 'This Month', value: '128h 10m' },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-slate-700 p-3">
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className="text-xl font-semibold text-white">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Activity Feed */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
        <div className="font-medium text-white">Team Activity Feed</div>
        <ul className="mt-4 space-y-3 text-sm">
          {[
            'Alex started task “Marketing Plan Q3”.',
            'Jamie logged 1h 20m on “API Integration”.',
            'Priya moved “Inventory Sync” to In Progress.',
            'Chen completed “Sprint Planning”.',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Project Progress */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
        <div className="font-medium text-white">Project Progress</div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {[
            { name: 'Website Redesign', widthClass: 'w-[72%]' },
            { name: 'Inventory Module', widthClass: 'w-[44%]' },
            { name: 'Mobile App', widthClass: 'w-[86%]' },
          ].map((p) => (
            <div key={p.name}>
              <div className="mb-1 text-slate-300">{p.name}</div>
              <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                <div className={`h-2 bg-indigo-500 rounded ${p.widthClass}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Completion */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="font-medium text-white">Task Completion</div>
        <div className="mt-4 text-3xl text-white">76%</div>
        <div className="text-xs text-slate-400">Last 7 days</div>
      </div>
    </div>
  )
}



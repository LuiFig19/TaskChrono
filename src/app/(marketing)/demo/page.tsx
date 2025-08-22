export default function DemoDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold">TaskChrono Demo Dashboard</h1>
      <p className="mt-2 text-gray-600">Read-only mock widgets showcasing key insights.</p>
      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        {/* Time Tracking Overview */}
        <div className="rounded-xl border bg-white p-5">
          <div className="font-medium">Time Tracking Overview</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Today', value: '6h 12m' },
              { label: 'This Week', value: '32h 45m' },
              { label: 'This Month', value: '128h 10m' },
            ].map((s) => (
              <div key={s.label} className="rounded-md border p-3">
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-xl font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity Feed */}
        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <div className="font-medium">Team Activity Feed</div>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              'Alex started task “Marketing Plan Q3”.',
              'Jamie logged 1h 20m on “API Integration”.',
              'Priya moved “Inventory Sync” to In Progress.',
              'Chen completed “Sprint Planning”.',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Project Progress */}
        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <div className="font-medium">Project Progress</div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            {[
              { name: 'Website Redesign', widthClass: 'w-[72%]' },
              { name: 'Inventory Module', widthClass: 'w-[44%]' },
              { name: 'Mobile App', widthClass: 'w-[86%]' },
            ].map((p) => (
              <div key={p.name}>
                <div className="mb-1">{p.name}</div>
                <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
                  <div className={`h-2 bg-indigo-600 rounded ${p.widthClass}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Completion */}
        <div className="rounded-xl border bg-white p-5">
          <div className="font-medium">Task Completion</div>
          <div className="mt-4 text-3xl">76%</div>
          <div className="text-xs text-gray-500">Last 7 days</div>
        </div>
      </div>
    </div>
  )
}



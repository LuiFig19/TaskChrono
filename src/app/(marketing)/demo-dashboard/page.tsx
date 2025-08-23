import DemoPreview from '@/components/marketing/DemoPreview'

export default function DemoDashboardShowcase() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      {/* Full interactive demo mirrors actual dashboard; no locks */}
      <DemoPreview />
    </div>
  )
}



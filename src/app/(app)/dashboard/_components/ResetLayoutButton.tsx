"use client"

export default function ResetLayoutButton() {
	return (
		<button
			className="px-3 py-1.5 rounded-full border border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-800 shadow-sm transition-colors"
			onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tc:reset-layout')) }}
			title="Revert to default layout"
		>
			↺ Reset
		</button>
	)
}

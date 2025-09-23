"use client"

import React from 'react'

export default function InviteJoinClient() {
	const [state, setState] = React.useState<'loading'|'need-auth'|'ready'|'error'>('loading')
	const [orgId, setOrgId] = React.useState<string | null>(null)
	const [email, setEmail] = React.useState<string | null>(null)

	React.useEffect(() => {
		const url = new URL(window.location.href)
		const token = url.searchParams.get('token') || ''
		;(async () => {
			try {
				const res = await fetch(`/api/join?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
				if (!res.ok) throw new Error('bad')
				const data = await res.json()
				setOrgId(data.orgId || null)
				if (data.needsAuth) {
					setEmail(data.email || null)
					setState('need-auth')
				} else {
					setState('ready')
					// redirect to dashboard immediately when already signed in
					window.location.href = '/dashboard'
				}
			} catch {
				setState('error')
			}
		})()
	}, [])

	if (state === 'loading') return null

	return (
		<div className="fixed inset-0 z-[100000]">
			<div className="absolute inset-0 bg-slate-950/90" />
			<div className="absolute inset-0 grid place-items-center p-4">
				<div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
					<div className="text-white font-semibold">Invitation</div>
					{state === 'need-auth' && (
						<div className="text-sm text-slate-300 mt-1">You were invited to join a workspace on TaskChrono. Continue to sign up and join.</div>
					)}
					{state === 'error' && <div className="text-sm text-rose-400 mt-1">This invite link is invalid or expired.</div>}
					<div className="mt-5 flex items-center justify-end gap-2">
						<button onClick={()=>{ window.location.href='/' }} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
						{state==='need-auth' && (
            <button onClick={()=>{
								const dst = '/dashboard'
								const url = `/auth/popup?dst=${encodeURIComponent(dst)}&hint=${encodeURIComponent(email||'')}`
								const w = 420, h = 560
								const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
								const top = Math.round(window.screenY + (window.outerHeight - h) / 2)
								const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`
								const child = window.open(url, 'tc-oauth', features)
								const handler = (e: MessageEvent) => {
									if (e.origin !== window.location.origin) return
									if (typeof e.data === 'object' && (e.data as any)?.type === 'tc:signed-in') {
										window.removeEventListener('message', handler)
										try { child?.close() } catch {}
										// finalize acceptance now that we are authenticated
										const tok = new URL(window.location.href).searchParams.get('token') || ''
										;(async () => { try { await fetch(`/api/join?token=${encodeURIComponent(tok)}`, { cache: 'no-store' }) } catch {} })()
										window.location.href = '/dashboard'
									}
								}
								window.addEventListener('message', handler)
							}} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Continue</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}


